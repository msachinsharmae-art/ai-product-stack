import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generatePRD } from "@/lib/prd.functions";

const Body = z.object({
  transcript: z.string().min(20).max(20000),
  title: z.string().min(1).max(200).optional(),
});

export const Route = createFileRoute("/api/public/prd")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PRD_WEBHOOK_SECRET;
        if (!secret) {
          return Response.json({ error: "Server not configured" }, { status: 500 });
        }
        const provided =
          request.headers.get("x-webhook-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (provided !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = Body.safeParse(json);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.message }, { status: 400 });
        }

        try {
          const result = await generateAndSavePRD({
            data: { transcript: parsed.data.transcript, title: parsed.data.title },
          });
          const origin = new URL(request.url).origin;
          return Response.json({
            id: result.id,
            title: result.prd.title,
            shareUrl: `${origin}/p/${result.id}`,
          });
        } catch (e) {
          return Response.json(
            { error: e instanceof Error ? e.message : "Failed" },
            { status: 500 },
          );
        }
      },
    },
  },
});
