import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ~20MB base64 ≈ ~15MB binary audio
const MAX_AUDIO_BASE64 = 20_000_000;
const MAX_RAW_TEXT = 50_000;

const InputSchema = z.object({
  audioBase64: z.string().max(MAX_AUDIO_BASE64, "Audio file too large (max ~15MB).").optional(),
  audioMimeType: z.string().max(100).optional(),
  rawText: z.string().max(MAX_RAW_TEXT, "Text input too long (max 50,000 characters).").optional(),
  featureHint: z.string().max(500).optional(),
});

export type PRDStruct = {
  title: string;
  problem: string;
  targetUsers: string;
  goals: string[];
  nonGoals: string[];
  userStories: { story: string; acceptanceCriteria: string[] }[];
  successMetrics: string[];
  risks: string[];
  openQuestions: string[];
};

export type PRDResult = {
  id: string;
  transcript: string;
  prd: PRDStruct;
  markdown: string;
  notionUrl?: string | null;
  googleDocUrl?: string | null;
};

const PRD_SYSTEM_PROMPT = `You are a Senior Product Manager writing a high-quality PRD.
You receive a rough voice memo or note from a PM. Convert it into a structured, professional PRD.
Be specific, actionable, and use concrete examples. Avoid generic fluff.
Use the user's domain language. If something is unclear, infer the most likely intent and add it to "openQuestions".`;

export const generatePRD = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<PRDResult> => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    let transcript = data.rawText?.trim() ?? "";

    if (data.audioBase64) {
      const audioBuffer = Buffer.from(data.audioBase64, "base64");
      const mimeType = data.audioMimeType || "audio/webm";
      const ext = mimeType.includes("mp3") ? "mp3"
        : mimeType.includes("wav") ? "wav"
        : mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a"
        : "webm";

      const formData = new FormData();
      formData.append("file", new Blob([audioBuffer], { type: mimeType }), `voice.${ext}`);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "json");

      const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });
      if (!groqRes.ok) {
        console.error("Groq transcription failed", groqRes.status, await groqRes.text());
        throw new Error("Audio transcription service unavailable. Please try again.");
      }
      const groqData = (await groqRes.json()) as { text: string };
      transcript = (data.rawText ? data.rawText + "\n\n" : "") + groqData.text;
    }

    if (!transcript || transcript.length < 10) {
      throw new Error("Need at least 10 characters of input (audio or text).");
    }

    const userPrompt = `${data.featureHint ? `Feature context: ${data.featureHint}\n\n` : ""}Voice memo / notes from the PM:\n"""\n${transcript}\n"""\n\nWrite a complete PRD now.`;

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: PRD_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_prd",
            description: "Submit a fully structured PRD.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                problem: { type: "string" },
                targetUsers: { type: "string" },
                goals: { type: "array", items: { type: "string" } },
                nonGoals: { type: "array", items: { type: "string" } },
                userStories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      story: { type: "string" },
                      acceptanceCriteria: { type: "array", items: { type: "string" } },
                    },
                    required: ["story", "acceptanceCriteria"],
                  },
                },
                successMetrics: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                openQuestions: { type: "array", items: { type: "string" } },
              },
              required: ["title", "problem", "targetUsers", "goals", "nonGoals", "userStories", "successMetrics", "risks", "openQuestions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_prd" } },
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      console.error("Groq chat failed", aiRes.status, detail);
      if (aiRes.status === 429) throw new Error("Rate limit hit. Wait a moment and try again.");
      throw new Error("AI service unavailable. Please try again.");
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("AI did not return a structured PRD.");

    const prd = JSON.parse(toolCall.function.arguments) as PRDStruct;
    const markdown = renderMarkdown(prd, transcript);

    // Save to DB
    const { data: row, error } = await supabaseAdmin
      .from("prds")
      .insert({
        title: prd.title,
        transcript,
        prd_json: prd as never,
        markdown,
      })
      .select("id")
      .single();
    if (error) {
      console.error("Failed to save PRD", error);
      throw new Error("Failed to save PRD. Please try again.");
    }

    return { id: row.id, transcript, prd, markdown };
  });

/* ---------- Destinations ---------- */

const PushSchema = z.object({ prdId: z.string().uuid() });

async function loadPRD(prdId: string) {
  const { data, error } = await supabaseAdmin
    .from("prds")
    .select("*")
    .eq("id", prdId)
    .single();
  if (error || !data) {
    console.error("loadPRD failed", error);
    throw new Error("PRD not found or unavailable.");
  }
  return data;
}

export const pushToNotion = createServerFn({ method: "POST" })
  .inputValidator((i) => PushSchema.parse(i))
  .handler(async ({ data }): Promise<{ url: string }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const NOTION_API_KEY = process.env.NOTION_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!NOTION_API_KEY) throw new Error("NOTION_API_KEY missing — connect Notion");

    const row = await loadPRD(data.prdId);
    const prd = row.prd_json as PRDStruct;

    const GW = "https://connector-gateway.lovable.dev/notion/v1";
    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": NOTION_API_KEY,
      "Content-Type": "application/json",
    };

    // Find a parent page the integration has access to
    const searchRes = await fetch(`${GW}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ filter: { value: "page", property: "object" }, page_size: 1 }),
    });
    const searchData = await searchRes.json();
    if (!searchRes.ok) {
      console.error("Notion search failed", searchRes.status, searchData);
      throw new Error("Notion is unavailable. Please try again.");
    }
    const parent = searchData.results?.[0];
    if (!parent) {
      throw new Error("No accessible Notion page found. Share a page with the Lovable integration in Notion, then retry.");
    }

    const blocks = prdToNotionBlocks(prd);

    const createRes = await fetch(`${GW}/pages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        parent: { type: "page_id", page_id: parent.id },
        properties: {
          title: { title: [{ type: "text", text: { content: prd.title } }] },
        },
        children: blocks,
      }),
    });
    const created = await createRes.json();
    if (!createRes.ok) {
      console.error("Notion create failed", createRes.status, created);
      throw new Error("Failed to create Notion page. Please try again.");
    }
    const url: string = created.url;

    await supabaseAdmin.from("prds").update({ notion_url: url }).eq("id", data.prdId);
    return { url };
  });

export const pushToGoogleDocs = createServerFn({ method: "POST" })
  .inputValidator((i) => PushSchema.parse(i))
  .handler(async ({ data }): Promise<{ url: string }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GDOCS_KEY = process.env.GOOGLE_DOCS_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!GDOCS_KEY) throw new Error("GOOGLE_DOCS_API_KEY missing — connect Google Docs");

    const row = await loadPRD(data.prdId);
    const markdown: string = row.markdown;
    const title: string = row.title;

    const GW = "https://connector-gateway.lovable.dev/google_docs/v1";
    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GDOCS_KEY,
      "Content-Type": "application/json",
    };

    const createRes = await fetch(`${GW}/documents`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title }),
    });
    const created = await createRes.json();
    if (!createRes.ok) {
      console.error("Google Docs create failed", createRes.status, created);
      throw new Error("Failed to create Google Doc. Please try again.");
    }
    const docId: string = created.documentId;

    await fetch(`${GW}/documents/${docId}:batchUpdate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        requests: [{ insertText: { location: { index: 1 }, text: markdown + "\n" } }],
      }),
    });

    const url = `https://docs.google.com/document/d/${docId}/edit`;
    await supabaseAdmin.from("prds").update({ google_doc_url: url }).eq("id", data.prdId);
    return { url };
  });

const SlackSchema = z.object({
  prdId: z.string().uuid(),
  channel: z.string().min(1).max(100).default("general"),
});

export const pushToSlack = createServerFn({ method: "POST" })
  .inputValidator((i) => SlackSchema.parse(i))
  .handler(async ({ data }): Promise<{ ts: string; channel: string }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const SLACK_API_KEY = process.env.SLACK_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!SLACK_API_KEY) throw new Error("SLACK_API_KEY missing — connect Slack");

    const row = await loadPRD(data.prdId);
    const prd = row.prd_json as PRDStruct;
    const channel = data.channel.replace(/^#/, "");

    const GW = "https://connector-gateway.lovable.dev/slack/api";
    const headers = {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": SLACK_API_KEY,
      "Content-Type": "application/json",
    };

    const goalsBullets = prd.goals.slice(0, 3).map((g) => `• ${g}`).join("\n");
    const links: string[] = [];
    if (row.notion_url) links.push(`<${row.notion_url}|Notion>`);
    if (row.google_doc_url) links.push(`<${row.google_doc_url}|Google Doc>`);

    const text = `:rocket: *New PRD:* ${prd.title}\n\n*Problem:* ${prd.problem}\n\n*Top goals:*\n${goalsBullets}${links.length ? `\n\n${links.join(" · ")}` : ""}`;

    const res = await fetch(`${GW}/chat.postMessage`, {
      method: "POST",
      headers,
      body: JSON.stringify({ channel, text, mrkdwn: true }),
    });
    const out = await res.json();
    if (!out.ok) {
      console.error("Slack post failed", out);
      throw new Error("Failed to post to Slack. Please try again.");
    }
    return { ts: out.ts, channel: out.channel };
  });

const EmailSchema = z.object({
  prdId: z.string().uuid(),
  to: z.string().email(),
});

export const emailPRD = createServerFn({ method: "POST" })
  .inputValidator((i) => EmailSchema.parse(i))
  .handler(async ({ data }): Promise<{ id: string }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing — connect Resend");

    const row = await loadPRD(data.prdId);
    const prd = row.prd_json as PRDStruct;

    const links: string[] = [];
    if (row.notion_url) links.push(`<a href="${row.notion_url}" style="color:#10b981">📝 Notion</a>`);
    if (row.google_doc_url) links.push(`<a href="${row.google_doc_url}" style="color:#10b981">📄 Google Doc</a>`);
    const shareUrl = `https://project--f1f55728-b17e-40a1-bd4b-3fd32c932927-dev.lovable.app/p/${row.id}`;
    links.push(`<a href="${shareUrl}" style="color:#10b981">🔗 Share page</a>`);

    const esc = (s: string) =>
      String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const goals = prd.goals.slice(0, 3).map((g) => `<li style="margin:4px 0">${esc(g)}</li>`).join("");

    const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#0a0a0f;color:#fff;margin:0;padding:0">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f">
<tr><td align="center" style="padding:32px 16px">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#11111a;border-radius:16px;border:1px solid rgba(255,255,255,0.08)">
    <tr><td style="padding:32px">
      <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#10b981;font-weight:600">PRD Autopilot · Digest</div>
      <h1 style="font-size:28px;font-weight:800;margin:8px 0 16px;color:#fff;line-height:1.2">${esc(prd.title)}</h1>
      <p style="font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 24px;line-height:1.6">${esc(prd.problem)}</p>
      <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5);font-weight:600">Top Goals</div>
      <ul style="font-size:14px;color:rgba(255,255,255,0.85);margin:8px 0 24px;padding-left:18px">${goals}</ul>

      <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.08);font-size:13px">${links.join(" &nbsp;·&nbsp; ")}</div>
    </td></tr>
  </table>
  <p style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:16px">Built by Sachin Kumar Sharma · AI Product Ops Stack</p>
</td></tr></table></body></html>`;

    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PRD Autopilot <onboarding@resend.dev>",
        to: [data.to],
        subject: `📋 PRD: ${prd.title.replace(/[\r\n]+/g, " ").slice(0, 200)}`,
        html,
      }),
    });
    const out = await res.json();
    if (!res.ok) {
      console.error("Resend failed", res.status, out);
      throw new Error("Failed to send email. Please try again.");
    }
    return { id: out.id ?? "sent" };
  });

export const listPRDs = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("prds")
    .select("id, title, created_at, notion_url, google_doc_url")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getPRD = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const row = await loadPRD(data.id);
    return {
      id: row.id as string,
      title: row.title as string,
      transcript: row.transcript as string,
      prd: row.prd_json as PRDStruct,
      markdown: row.markdown as string,
      notion_url: (row.notion_url as string | null) ?? null,
      google_doc_url: (row.google_doc_url as string | null) ?? null,
      created_at: row.created_at as string,
    };
  });

/* ---------- Helpers ---------- */

function renderMarkdown(prd: PRDStruct, transcript: string): string {
  const L: string[] = [];
  L.push(`# ${prd.title}`, "");
  L.push(`> Generated by AI Product Ops Stack · ${new Date().toLocaleDateString()}`, "");
  L.push("## Problem", prd.problem, "");
  L.push("## Target Users", prd.targetUsers, "");
  L.push("## Goals");
  prd.goals.forEach((g) => L.push(`- ${g}`));
  L.push("", "## Non-Goals");
  prd.nonGoals.forEach((g) => L.push(`- ${g}`));
  L.push("", "## User Stories");
  prd.userStories.forEach((us, i) => {
    L.push(`### Story ${i + 1}`, us.story, "", "**Acceptance Criteria:**");
    us.acceptanceCriteria.forEach((ac) => L.push(`- ${ac}`));
    L.push("");
  });
  L.push("## Success Metrics");
  prd.successMetrics.forEach((m) => L.push(`- ${m}`));
  L.push("", "## Risks");
  prd.risks.forEach((r) => L.push(`- ${r}`));
  L.push("", "## Open Questions");
  prd.openQuestions.forEach((q) => L.push(`- ${q}`));
  L.push("", "---", "", "## Original Voice Memo / Notes", "```", transcript, "```");
  return L.join("\n");
}

function p(text: string) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }] },
  };
}
function h(level: 1 | 2 | 3, text: string) {
  const key = `heading_${level}` as const;
  return {
    object: "block",
    type: key,
    [key]: { rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }] },
  };
}
function bullet(text: string) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: [{ type: "text", text: { content: text.slice(0, 1900) } }] },
  };
}

function prdToNotionBlocks(prd: PRDStruct): unknown[] {
  const b: unknown[] = [];
  b.push(h(2, "Problem"), p(prd.problem));
  b.push(h(2, "Target Users"), p(prd.targetUsers));
  b.push(h(2, "Goals"));
  prd.goals.forEach((g) => b.push(bullet(g)));
  b.push(h(2, "Non-Goals"));
  prd.nonGoals.forEach((g) => b.push(bullet(g)));
  b.push(h(2, "User Stories"));
  prd.userStories.forEach((us, i) => {
    b.push(h(3, `Story ${i + 1}`), p(us.story), p("Acceptance Criteria:"));
    us.acceptanceCriteria.forEach((ac) => b.push(bullet(ac)));
  });
  b.push(h(2, "Success Metrics"));
  prd.successMetrics.forEach((m) => b.push(bullet(m)));
  b.push(h(2, "Risks"));
  prd.risks.forEach((r) => b.push(bullet(r)));
  b.push(h(2, "Open Questions"));
  prd.openQuestions.forEach((q) => b.push(bullet(q)));
  return b;
}
