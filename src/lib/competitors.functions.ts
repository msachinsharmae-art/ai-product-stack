import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Competitor = {
  id: string;
  name: string;
  domain: string | null;
  twitter_handle: string | null;
  topic: string | null;
  active: boolean;
  created_at: string;
};

export const listCompetitors = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("competitors")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Competitor[];
});

const NameSchema = z.string().trim().min(1).max(120);
const DomainSchema = z.string().trim().max(200).optional().nullable();
const HandleSchema = z.string().trim().max(50).regex(/^@?[A-Za-z0-9_]*$/).optional().nullable();
const TopicSchema = z.string().trim().max(200).optional().nullable();

export const upsertCompetitor = createServerFn({ method: "POST" })
  .inputValidator((i) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: NameSchema,
        domain: DomainSchema,
        twitter_handle: HandleSchema,
        topic: TopicSchema,
        active: z.boolean().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data }) => {
    const row = {
      name: data.name,
      domain: data.domain || null,
      twitter_handle: data.twitter_handle ? data.twitter_handle.replace(/^@/, "") : null,
      topic: data.topic || null,
      active: data.active ?? true,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("competitors").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("competitors")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: inserted.id as string };
  });

export const deleteCompetitor = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("competitors").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleCompetitorActive = createServerFn({ method: "POST" })
  .inputValidator((i) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("competitors")
      .update({ active: data.active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
