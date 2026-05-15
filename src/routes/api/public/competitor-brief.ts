import { createFileRoute } from "@tanstack/react-router";
import { generateBrief } from "@/lib/radar.functions";

export const Route = createFileRoute("/api/public/competitor-brief")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PRD_WEBHOOK_SECRET;
        if (!secret) return Response.json({ error: "Server not configured" }, { status: 500 });
        const provided =
          request.headers.get("x-webhook-secret") ??
          request.headers.get("x-api-key") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (provided !== secret) return new Response("Unauthorized", { status: 401 });

        try {
          const result = await generateBrief();
          if (!result.ok) {
            return Response.json({ error: result.reason }, { status: 400 });
          }
          const origin = new URL(request.url).origin;
          const tokenQs = result.shareToken ? `?token=${result.shareToken}` : "";
          return Response.json(
            {
              id: result.id,
              title: result.title,
              signalCount: result.signalCount,
              shareUrl: `${origin}/radar/${result.id}${tokenQs}`,
            },
            { status: result.existed ? 200 : 201 },
          );
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
