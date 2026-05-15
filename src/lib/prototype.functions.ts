import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  idea: z.string().trim().min(5).max(2000),
  format: z.enum(["html", "react", "wireframe"]),
});

export type PrototypeResult = {
  format: "html" | "react" | "wireframe";
  idea: string;
  html?: string;
  react?: string;
  imageDataUrl?: string;
  notes?: string;
};

export const generatePrototype = createServerFn({ method: "POST" })
  .inputValidator((i) => InputSchema.parse(i))
  .handler(async ({ data }): Promise<PrototypeResult> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (data.format === "wireframe") {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: `Generate a clean, modern UI wireframe / mockup screen for this product idea: ${data.idea}. Style: minimal, light background, clear hierarchy, realistic UI components, single hero screen, 16:9.`,
            },
          ],
          modalities: ["image", "text"],
        }),
      });
      if (!aiRes.ok) {
        if (aiRes.status === 429) throw new Error("AI rate limit hit. Try again shortly.");
        if (aiRes.status === 402) throw new Error("AI credits exhausted. Top up in Workspace → Usage.");
        throw new Error(`Image gen failed [${aiRes.status}]: ${await aiRes.text()}`);
      }
      const aiData = await aiRes.json();
      const imageDataUrl: string | undefined =
        aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageDataUrl) throw new Error("No image returned from AI.");
      return { format: "wireframe", idea: data.idea, imageDataUrl };
    }

    const isHtml = data.format === "html";
    const system = isHtml
      ? `You are a senior product designer. Output a SINGLE self-contained HTML file using Tailwind CSS via the official CDN <script src="https://cdn.tailwindcss.com"></script>. The page must be a polished, realistic UI prototype of the user's idea — not a wireframe. Use modern aesthetics, sensible spacing, real-looking sample data, icons via inline SVG. NO external images. Mobile-friendly. Output ONLY the HTML, starting with <!doctype html>. No prose, no markdown fences.`
      : `You are a senior React engineer. Output a SINGLE React functional component (TypeScript ok) named Prototype, using Tailwind CSS classes only (no external imports beyond React). It should be a polished, realistic UI prototype of the user's idea with sensible sample data. NO external images. Output ONLY the code, no markdown fences, no prose.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Idea: ${data.idea}` },
        ],
      }),
    });
    if (!aiRes.ok) {
      if (aiRes.status === 429) throw new Error("AI rate limit hit. Try again shortly.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted. Top up in Workspace → Usage.");
      throw new Error(`AI gateway error [${aiRes.status}]: ${await aiRes.text()}`);
    }
    const aiData = await aiRes.json();
    let content: string = aiData.choices?.[0]?.message?.content ?? "";

    // Strip markdown fences if model added them
    content = content.replace(/^```(?:html|tsx|jsx|typescript|ts|react)?\n?/i, "").replace(/```\s*$/i, "").trim();

    return isHtml
      ? { format: "html", idea: data.idea, html: content }
      : { format: "react", idea: data.idea, react: content };
  });
