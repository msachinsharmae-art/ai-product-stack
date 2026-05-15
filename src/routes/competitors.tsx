import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  deleteCompetitor,
  listCompetitors,
  toggleCompetitorActive,
  upsertCompetitor,
  type Competitor,
} from "@/lib/competitors.functions";

export const Route = createFileRoute("/competitors")({
  head: () => ({
    meta: [
      { title: "Your Competitor Watchlist — Radar" },
      {
        name: "description",
        content: "Manage the list of competitors that the Radar agent scrapes and summarizes every morning.",
      },
    ],
  }),
  loader: () => listCompetitors(),
  component: CompetitorsPage,
});

function CompetitorsPage() {
  const competitors = Route.useLoaderData();
  const router = useRouter();
  const save = useServerFn(upsertCompetitor);
  const remove = useServerFn(deleteCompetitor);
  const toggle = useServerFn(toggleCompetitorActive);

  const [editing, setEditing] = useState<Partial<Competitor> | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function startNew() {
    setEditing({ name: "", domain: "", twitter_handle: "", topic: "", active: true });
    setErr(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setErr(null);
    try {
      await save({
        data: {
          id: editing.id,
          name: (editing.name ?? "").trim(),
          domain: editing.domain ?? null,
          twitter_handle: editing.twitter_handle ?? null,
          topic: editing.topic ?? null,
          active: editing.active ?? true,
        },
      });
      setEditing(null);
      router.invalidate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Remove this competitor from the watchlist?")) return;
    await remove({ data: { id } });
    router.invalidate();
  }

  async function onToggle(c: Competitor) {
    await toggle({ data: { id: c.id, active: !c.active } });
    router.invalidate();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-black">
              S
            </div>
            <span className="text-sm font-semibold tracking-tight">AI Product Ops Stack</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-white/60">
            <Link to="/demo" className="transition hover:text-white">PRD</Link>
            <Link to="/radar" className="transition hover:text-white">Radar</Link>
            <Link to="/competitors" className="text-white">Competitors</Link>
            <Link to="/dashboard" className="transition hover:text-white">Dashboard</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-12 pb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Watchlist
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Your competitors</h1>
            <p className="mt-3 max-w-xl text-white/60">
              The Radar agent only watches who you tell it to. Add a row for each competitor; n8n reads this
              list and scrapes their changelog, Twitter, and reviews on a schedule.
            </p>
          </div>
          <button
            onClick={startNew}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2.5 text-sm font-bold text-black hover:opacity-90"
          >
            + Add competitor
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        {competitors.length === 0 && !editing ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
            <p className="text-white/60">No competitors yet.</p>
            <button onClick={startNew} className="mt-4 text-sm font-semibold text-cyan-300 hover:underline">
              Add your first competitor →
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {competitors.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.name}</span>
                    {!c.active && (
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase text-white/50">
                        paused
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/50">
                    {c.domain && <span>🌐 {c.domain}</span>}
                    {c.twitter_handle && <span>𝕏 @{c.twitter_handle}</span>}
                    {c.topic && <span>· {c.topic}</span>}
                  </div>
                </div>
                <button
                  onClick={() => onToggle(c)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                >
                  {c.active ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => setEditing(c)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(c.id)}
                  className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setEditing(null)}>
          <form
            onSubmit={onSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg space-y-4 rounded-2xl border border-white/10 bg-[#0f0f17] p-6"
          >
            <h2 className="text-xl font-bold">{editing.id ? "Edit competitor" : "New competitor"}</h2>

            <Field label="Name *" placeholder="Linear" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} required />
            <Field label="Domain" placeholder="linear.app" value={editing.domain ?? ""} onChange={(v) => setEditing({ ...editing, domain: v })} />
            <Field label="Twitter handle" placeholder="linear" value={editing.twitter_handle ?? ""} onChange={(v) => setEditing({ ...editing, twitter_handle: v })} />
            <Field label="Topic / category" placeholder="Project management for engineering teams" value={editing.topic ?? ""} onChange={(v) => setEditing({ ...editing, topic: v })} />

            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={editing.active ?? true}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-4 w-4"
              />
              Active (Radar will scrape this competitor)
            </label>

            {err && <div className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">{err}</div>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white">
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !(editing.name ?? "").trim()}
                className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-white/60">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-cyan-400/50"
      />
    </label>
  );
}
