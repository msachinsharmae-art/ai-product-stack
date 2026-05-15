import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SignalSchema = z.object({
  competitor_name: z.string().min(1).max(200),
  source_type: z.enum(["changelog", "tweet", "review", "job", "blog", "other"]),
  title: z.string().min(1).max(500),
  url: z.string().url().max(1000).optional(),
  content: z.string().max(50_000).optional(),
  published_at: z.string().datetime().optional(),
}).refine((s) => !!(s.url || s.content), {
  message: "Either url or content is required",
});

const Body = z.union([
  SignalSchema,
  z.object({ signals: z.array(SignalSchema).min(1).max(200) }),
]);

function dedupKey(s: z.infer<typeof SignalSchema>): string {
  const tail = s.url ?? createHash("sha256").update(s.content ?? "").digest("hex");
  return createHash("sha256")
    .update(`${s.competitor_name.toLowerCase()}|${s.source_type}|${s.title}|${tail}`)
    .digest("hex");
}

export const Route = createFileRoute("/api/public/competitor-signals")({
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

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = Body.safeParse(json);
        if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });

        const items = "signals" in parsed.data ? parsed.data.signals : [parsed.data];

        // Compute dedup keys + check existing
        const keys = items.map(dedupKey);
        const { data: existing, error: lookupErr } = await supabaseAdmin
          .from("competitor_signals")
          .select("id, dedup_key")
          .in("dedup_key", keys);
        if (lookupErr) return Response.json({ error: lookupErr.message }, { status: 500 });

        const existingMap = new Map((existing ?? []).map((r) => [r.dedup_key as string, r.id as string]));

        const toInsert: Array<{ row: Record<string, unknown>; key: string; idx: number }> = [];
        const results = items.map((s, i) => {
          const key = keys[i];
          const existingId = existingMap.get(key);
          if (existingId) {
            return { dedupKey: key, id: existingId, status: "duplicate" as const };
          }
          toInsert.push({
            key,
            idx: i,
            row: {
              competitor_name: s.competitor_name,
              source_type: s.source_type,
              title: s.title,
              url: s.url ?? null,
              content: s.content ?? null,
              published_at: s.published_at ?? null,
              dedup_key: key,
            },
          });
          return { dedupKey: key, id: null as string | null, status: "created" as const };
        });

        let errors = 0;
        if (toInsert.length) {
          const { data: inserted, error: insertErr } = await supabaseAdmin
            .from("competitor_signals")
            .insert(toInsert.map((t) => t.row))
            .select("id, dedup_key");
          if (insertErr) {
            errors = toInsert.length;
            for (const t of toInsert) {
              results[t.idx] = { dedupKey: t.key, id: null, status: "created" };
            }
            return Response.json({ error: insertErr.message }, { status: 500 });
          }
          const insertedMap = new Map((inserted ?? []).map((r) => [r.dedup_key as string, r.id as string]));
          for (const t of toInsert) {
            const id = insertedMap.get(t.key) ?? null;
            results[t.idx] = { dedupKey: t.key, id, status: "created" };
          }
        }

        const accepted = results.filter((r) => r.status === "created").length;
        const duplicates = results.filter((r) => r.status === "duplicate").length;

        return Response.json({ accepted, duplicates, errors, signals: results });
      },
    },
  },
});
