import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SignalSchema = z.object({
  competitor_name: z.string().min(1).max(200),
  source_type: z.enum(["changelog", "tweet", "review", "job", "blog", "other"]),
  title: z.string().min(1).max(500),
  url: z.string().url().max(1000).optional(),
  content: z.string().max(5000).optional(),
  published_at: z.string().datetime().optional(),
});

const Body = z.union([SignalSchema, z.object({ signals: z.array(SignalSchema).min(1).max(100) })]);

export const Route = createFileRoute("/api/public/competitor-signals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PRD_WEBHOOK_SECRET;
        if (!secret) return Response.json({ error: "Server not configured" }, { status: 500 });
        const provided =
          request.headers.get("x-webhook-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (provided !== secret) return new Response("Unauthorized", { status: 401 });

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = Body.safeParse(json);
        if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

        const items = "signals" in parsed.data ? parsed.data.signals : [parsed.data];
        const rows = items.map((s) => ({
          competitor_name: s.competitor_name,
          source_type: s.source_type,
          title: s.title,
          url: s.url ?? null,
          content: s.content ?? null,
          published_at: s.published_at ?? null,
        }));

        const { error } = await supabaseAdmin.from("competitor_signals").insert(rows);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        return Response.json({ ok: true, inserted: rows.length });
      },
    },
  },
});
