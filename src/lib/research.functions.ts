import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  topic: z.string().trim().min(3).max(300),
});

export type ResearchSource = { title: string; url: string; snippet?: string };
export type ResearchResult = {
  topic: string;
  markdown: string;
  sources: ResearchSource[];
};

export const generateResearch = createServerFn({ method: "POST" })
  .inputValidator((i) => InputSchema.parse(i))
  .handler(async ({ data }): Promise<ResearchResult> => {
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!TAVILY_API_KEY) throw new Error("TAVILY_API_KEY is not configured");
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    // 1. Tavily search
    const tavRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `Market research and competitive landscape for: ${data.topic}`,
        search_depth: "advanced",
        max_results: 10,
        include_answer: true,
      }),
    });
    if (!tavRes.ok) {
      throw new Error(`Tavily search failed [${tavRes.status}]: ${await tavRes.text()}`);
    }
    const tav = (await tavRes.json()) as {
      answer?: string;
      results: { title: string; url: string; content: string }[];
    };

    const sources: ResearchSource[] = (tav.results ?? []).slice(0, 10).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 300),
    }));

    const sourcesContext = sources
      .map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${s.snippet ?? ""}`)
      .join("\n\n");

    // 2. Synthesize with Gemini
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content:
              "You are a senior product strategist writing a comprehensive market research brief for a Product Manager. Be specific, use numbers when sources provide them, cite sources inline as [1], [2] using the indexes given. Avoid generic fluff. Markdown only.",
          },
          {
            role: "user",
            content: `Topic: ${data.topic}

Tavily quick answer: ${tav.answer ?? "(none)"}

Sources:
${sourcesContext}

Write a comprehensive market overview brief with these sections (use ## headings):
1. Executive Summary (3-4 sentences)
2. Market Overview (size, growth, key segments, TAM/SAM if known)
3. Key Trends & Drivers (4-6 bullets)
4. Competitive Landscape (top 5-8 players with one-line positioning each)
5. User Pain Points & Opportunities (4-6 bullets)
6. Strategic Recommendations for a PM entering this space (3-5 bullets)

Cite sources inline as [n].`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) throw new Error("AI rate limit hit. Try again shortly.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted. Top up in Workspace → Usage.");
      throw new Error(`AI gateway error [${aiRes.status}]: ${await aiRes.text()}`);
    }
    const aiData = await aiRes.json();
    const choice = aiData.choices?.[0];
    const markdown: string = choice?.message?.content ?? "";
    if (!markdown.trim()) {
      console.error("Empty AI response", { finish: choice?.finish_reason, usage: aiData.usage });
      throw new Error(`AI returned empty content (finish_reason: ${choice?.finish_reason ?? "unknown"}). Try a more specific topic.`);
    }

    return { topic: data.topic, markdown, sources };
  });
