import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  // Either audio OR rawText must be provided
  audioBase64: z.string().optional(),
  audioMimeType: z.string().optional(),
  rawText: z.string().optional(),
  featureHint: z.string().max(500).optional(),
});

export type PRDResult = {
  transcript: string;
  prd: {
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
  markdown: string;
};

const PRD_SYSTEM_PROMPT = `You are a Senior Product Manager writing a high-quality PRD.
You receive a rough voice memo or note from a PM. Convert it into a structured, professional PRD.
Be specific, actionable, and use concrete examples. Avoid generic fluff.
Use the user's domain language. If something is unclear, infer the most likely intent and add it to "openQuestions".`;

export const generatePRD = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<PRDResult> => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // 1. Get transcript — either from audio (Groq Whisper) or directly from text
    let transcript = data.rawText?.trim() ?? "";

    if (data.audioBase64) {
      if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

      // Decode base64 to Buffer
      const audioBuffer = Buffer.from(data.audioBase64, "base64");
      const mimeType = data.audioMimeType || "audio/webm";
      const ext = mimeType.includes("mp3")
        ? "mp3"
        : mimeType.includes("wav")
        ? "wav"
        : mimeType.includes("mp4") || mimeType.includes("m4a")
        ? "m4a"
        : "webm";

      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: mimeType });
      formData.append("file", blob, `voice.${ext}`);
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("response_format", "json");

      const groqRes = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
          body: formData,
        }
      );

      if (!groqRes.ok) {
        const err = await groqRes.text();
        throw new Error(`Groq transcription failed [${groqRes.status}]: ${err}`);
      }

      const groqData = (await groqRes.json()) as { text: string };
      transcript = (data.rawText ? data.rawText + "\n\n" : "") + groqData.text;
    }

    if (!transcript || transcript.length < 10) {
      throw new Error("Need at least 10 characters of input (audio or text).");
    }

    // 2. Generate PRD via Lovable AI Gateway (Gemini 2.5) using tool-calling for structured output
    const userPrompt = `${data.featureHint ? `Feature context: ${data.featureHint}\n\n` : ""}Voice memo / notes from the PM:\n"""\n${transcript}\n"""\n\nWrite a complete PRD now.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: PRD_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_prd",
              description: "Submit a fully structured PRD.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Short, punchy feature title" },
                  problem: { type: "string", description: "Problem statement (2-4 sentences)" },
                  targetUsers: { type: "string", description: "Specific user segments" },
                  goals: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
                  nonGoals: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
                  userStories: {
                    type: "array",
                    minItems: 2,
                    maxItems: 6,
                    items: {
                      type: "object",
                      properties: {
                        story: { type: "string", description: "As a [user], I want [goal], so that [benefit]" },
                        acceptanceCriteria: { type: "array", items: { type: "string" }, minItems: 2 },
                      },
                      required: ["story", "acceptanceCriteria"],
                    },
                  },
                  successMetrics: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
                  risks: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
                  openQuestions: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 5 },
                },
                required: [
                  "title",
                  "problem",
                  "targetUsers",
                  "goals",
                  "nonGoals",
                  "userStories",
                  "successMetrics",
                  "risks",
                  "openQuestions",
                ],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_prd" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429)
        throw new Error("AI rate limit hit. Wait a moment and try again.");
      if (aiRes.status === 402)
        throw new Error("AI credits exhausted. Top up in Workspace → Usage.");
      const err = await aiRes.text();
      throw new Error(`AI gateway error [${aiRes.status}]: ${err}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return a structured PRD.");
    }

    const prd = JSON.parse(toolCall.function.arguments) as PRDResult["prd"];

    // 3. Render markdown for download/copy
    const markdown = renderMarkdown(prd, transcript);

    return { transcript, prd, markdown };
  });

function renderMarkdown(prd: PRDResult["prd"], transcript: string): string {
  const lines: string[] = [];
  lines.push(`# ${prd.title}`);
  lines.push("");
  lines.push(`> Generated by AI Product Ops Stack · ${new Date().toLocaleDateString()}`);
  lines.push("");
  lines.push("## Problem");
  lines.push(prd.problem);
  lines.push("");
  lines.push("## Target Users");
  lines.push(prd.targetUsers);
  lines.push("");
  lines.push("## Goals");
  prd.goals.forEach((g) => lines.push(`- ${g}`));
  lines.push("");
  lines.push("## Non-Goals");
  prd.nonGoals.forEach((g) => lines.push(`- ${g}`));
  lines.push("");
  lines.push("## User Stories");
  prd.userStories.forEach((us, i) => {
    lines.push(`### Story ${i + 1}`);
    lines.push(us.story);
    lines.push("");
    lines.push("**Acceptance Criteria:**");
    us.acceptanceCriteria.forEach((ac) => lines.push(`- ${ac}`));
    lines.push("");
  });
  lines.push("## Success Metrics");
  prd.successMetrics.forEach((m) => lines.push(`- ${m}`));
  lines.push("");
  lines.push("## Risks");
  prd.risks.forEach((r) => lines.push(`- ${r}`));
  lines.push("");
  lines.push("## Open Questions");
  prd.openQuestions.forEach((q) => lines.push(`- ${q}`));
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Original Voice Memo / Notes");
  lines.push("```");
  lines.push(transcript);
  lines.push("```");
  return lines.join("\n");
}
