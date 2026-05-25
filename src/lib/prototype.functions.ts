import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  idea: z.string().trim().min(5).max(2000),
  format: z.enum(["html", "react"]),
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
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY is not configured");

    if (data.format === "wireframe") {
      const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

      const prompt = `A clean, modern UI wireframe mockup for: ${data.idea}. Low-fidelity grayscale wireframe style with placeholder text, boxes for images, clear layout structure, navigation, buttons, and content sections. Flat design, no color, white background, thin black/gray strokes, annotated like a Figma wireframe. Desktop layout.`;

      const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });
      if (!imgRes.ok) {
        const detail = await imgRes.text();
        console.error("Lovable AI image failed", imgRes.status, detail);
        if (imgRes.status === 429) throw new Error("Rate limit hit. Try again shortly.");
        if (imgRes.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
        throw new Error("AI image service unavailable. Please try again.");
      }
      const imgData = await imgRes.json();
      const imageUrl: string | undefined = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) {
        console.error("Lovable AI image: no image in response", JSON.stringify(imgData).slice(0, 500));
        throw new Error("Image generation returned no image. Please try again.");
      }
      return { format: "wireframe", idea: data.idea, imageDataUrl: imageUrl };
    }

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
