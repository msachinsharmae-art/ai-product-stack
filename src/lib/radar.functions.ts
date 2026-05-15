import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type BriefStruct = {
  headline: string;
  shipped: { competitor: string; what: string; whySoWhat: string; url?: string }[];
  pricingMoves: { competitor: string; change: string; whySoWhat: string }[];
  negativeSignals: { competitor: string; theme: string; opportunity: string }[];
  hiringSignals: { competitor: string; role: string; strategicMove: string }[];
  takeaway: string;
};

const SYSTEM_PROMPT = `You are a Senior Competitive Intelligence Analyst for a Product Manager.
You receive raw signals scraped from competitor changelogs, tweets, reviews, and job listings over the last 24 hours.
Synthesize them into a sharp, no-fluff daily brief. For every item include a "so what?" — what it means strategically for the PM.
If a category has no signals, return an empty array. Do NOT invent items.`;

export const generateBrief = createServerFn({ method: "POST" }).handler(async () => {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  // Pull last 24h of signals
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: signals, error } = await supabaseAdmin
    .from("competitor_signals")
    .select("competitor_name, source_type, title, content, url, published_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(`Failed to load signals: ${error.message}`);
  if (!signals || signals.length === 0) {
    return { ok: false as const, reason: "No signals from the last 24 hours. POST some to /api/public/competitor-signals first." };
  }

  const signalText = signals
    .map(
      (s, i) =>
        `[${i + 1}] (${s.source_type}) ${s.competitor_name}: ${s.title}${s.content ? ` — ${s.content.slice(0, 400)}` : ""}${s.url ? ` (${s.url})` : ""}`,
    )
    .join("\n");

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Raw signals (last 24h):\n${signalText}\n\nWrite the daily brief now.` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "submit_brief",
            description: "Submit the daily competitor brief.",
            parameters: {
              type: "object",
              properties: {
                headline: { type: "string", description: "One sentence: the single biggest thing to know today." },
                shipped: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      competitor: { type: "string" },
                      what: { type: "string" },
                      whySoWhat: { type: "string" },
                      url: { type: "string" },
                    },
                    required: ["competitor", "what", "whySoWhat"],
                  },
                },
                pricingMoves: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      competitor: { type: "string" },
                      change: { type: "string" },
                      whySoWhat: { type: "string" },
                    },
                    required: ["competitor", "change", "whySoWhat"],
                  },
                },
                negativeSignals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      competitor: { type: "string" },
                      theme: { type: "string" },
                      opportunity: { type: "string" },
                    },
                    required: ["competitor", "theme", "opportunity"],
                  },
                },
                hiringSignals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      competitor: { type: "string" },
                      role: { type: "string" },
                      strategicMove: { type: "string" },
                    },
                    required: ["competitor", "role", "strategicMove"],
                  },
                },
                takeaway: { type: "string", description: "One actionable takeaway for the PM today." },
              },
              required: ["headline", "shipped", "pricingMoves", "negativeSignals", "hiringSignals", "takeaway"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "submit_brief" } },
    }),
  });

  if (!aiRes.ok) {
    if (aiRes.status === 429) throw new Error("AI rate limit hit. Wait a moment and try again.");
    if (aiRes.status === 402) throw new Error("AI credits exhausted. Top up in Workspace → Usage.");
    throw new Error(`AI gateway error [${aiRes.status}]: ${await aiRes.text()}`);
  }

  const aiData = await aiRes.json();
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) throw new Error("AI did not return a structured brief.");

  const brief = JSON.parse(toolCall.function.arguments) as BriefStruct;
  const markdown = renderBriefMarkdown(brief);
  const title = `Competitor Brief · ${new Date().toLocaleDateString()}`;

  const { data: row, error: insertErr } = await supabaseAdmin
    .from("competitor_briefs")
    .insert({
      title,
      markdown,
      brief_json: brief as never,
      signal_count: signals.length,
    })
    .select("id")
    .single();
  if (insertErr) throw new Error(`Failed to save brief: ${insertErr.message}`);

  return { id: row.id, title, brief, markdown, signalCount: signals.length };
});

export const listBriefs = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("competitor_briefs")
    .select("id, title, brief_date, signal_count, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getLatestBrief = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("competitor_briefs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id as string,
    title: data.title as string,
    brief: data.brief_json as BriefStruct,
    markdown: data.markdown as string,
    signalCount: data.signal_count as number,
    createdAt: data.created_at as string,
  };
});

export const getBrief = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("competitor_briefs")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error(error?.message ?? "Brief not found");
    return {
      id: row.id as string,
      title: row.title as string,
      brief: row.brief_json as BriefStruct,
      markdown: row.markdown as string,
      signalCount: row.signal_count as number,
      createdAt: row.created_at as string,
    };
  });

export const recentSignals = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("competitor_signals")
    .select("id, competitor_name, source_type, title, url, created_at")
    .order("created_at", { ascending: false })
    .limit(25);
  if (error) throw new Error(error.message);
  return data ?? [];
});

function renderBriefMarkdown(b: BriefStruct): string {
  const L: string[] = [];
  L.push(`# ${b.headline}`, "");
  if (b.shipped.length) {
    L.push("## 🚀 Shipped");
    b.shipped.forEach((s) =>
      L.push(`- **${s.competitor}** — ${s.what}${s.url ? ` ([source](${s.url}))` : ""}`, `  > ${s.whySoWhat}`),
    );
    L.push("");
  }
  if (b.pricingMoves.length) {
    L.push("## 💰 Pricing");
    b.pricingMoves.forEach((p) => L.push(`- **${p.competitor}** — ${p.change}`, `  > ${p.whySoWhat}`));
    L.push("");
  }
  if (b.negativeSignals.length) {
    L.push("## 🔍 Negative review themes (your opportunity)");
    b.negativeSignals.forEach((n) => L.push(`- **${n.competitor}** — ${n.theme}`, `  > ${n.opportunity}`));
    L.push("");
  }
  if (b.hiringSignals.length) {
    L.push("## 👥 Hiring signals");
    b.hiringSignals.forEach((h) => L.push(`- **${h.competitor}** — ${h.role}`, `  > ${h.strategicMove}`));
    L.push("");
  }
  L.push("---", "", `**Today's takeaway:** ${b.takeaway}`);
  return L.join("\n");
}
