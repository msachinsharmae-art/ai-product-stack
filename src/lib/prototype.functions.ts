import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  idea: z.string().trim().min(5).max(2000),
  format: z.enum(["html", "react"]),
});

export type PrototypeResult = {
  format: "html" | "react";
  idea: string;
  html?: string;
  react?: string;
  imageDataUrl?: string;
  notes?: string;
};

export const generatePrototype = createServerFn({ method: "POST" })
  .inputValidator((i) => InputSchema.parse(i))
  .handler(async ({ data }): Promise<PrototypeResult> => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");


    const isHtml = data.format === "html";
    const system = isHtml
      ? `You are a senior product designer. Output a SINGLE self-contained HTML file using Tailwind CSS via the official CDN <script src="https://cdn.tailwindcss.com"></script>. The page must be a polished, realistic UI prototype of the user's idea — not a wireframe. Use modern aesthetics, sensible spacing, real-looking sample data, icons via inline SVG. NO external images. Mobile-friendly. Output ONLY the HTML, starting with <!doctype html>. No prose, no markdown fences.`
      : `You are a senior React engineer. Output a SINGLE React functional component (TypeScript ok) named Prototype, using Tailwind CSS classes only (no external imports beyond React). It should be a polished, realistic UI prototype of the user's idea with sensible sample data. NO external images. Output ONLY the code, no markdown fences, no prose.`;

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 8192,
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Idea: ${data.idea}` },
        ],
      }),
    });
    if (!aiRes.ok) {
      const detail = await aiRes.text();
      console.error("Groq chat failed", aiRes.status, detail);
      if (aiRes.status === 429) throw new Error("Rate limit hit. Try again shortly.");
      throw new Error("AI service unavailable. Please try again.");
    }
    const aiData = await aiRes.json();
    let content: string = aiData.choices?.[0]?.message?.content ?? "";

    // Strip markdown fences if model added them
    content = content.replace(/^```(?:html|tsx|jsx|typescript|ts|react)?\n?/i, "").replace(/```\s*$/i, "").trim();

    return isHtml
      ? { format: "html", idea: data.idea, html: content }
      : { format: "react", idea: data.idea, react: content };
  });
