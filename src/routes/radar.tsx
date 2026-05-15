import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateBrief, getLatestBrief, listBriefs, recentSignals, type BriefStruct } from "@/lib/radar.functions";

export const Route = createFileRoute("/radar")({
  head: () => ({
    meta: [
      { title: "Competitor Radar — Daily AI Brief on Your Top Competitors" },
      {
        name: "description",
        content:
          "An AI agent watches your competitors' changelogs, tweets, reviews, and job listings — and ships you a 1-page brief every morning at 8 AM.",
      },
    ],
  }),
  loader: async () => {
    const [latest, briefs, signals] = await Promise.all([
      getLatestBrief(),
      listBriefs(),
      recentSignals(),
    ]);
    return { latest, briefs, signals };
  },
  component: RadarPage,
});

function RadarPage() {
  const { latest, briefs, signals } = Route.useLoaderData();
  const router = useRouter();
  const generate = useServerFn(generateBrief);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onGenerate() {
    setBusy(true);
    setErr(null);
    try {
      const res = await generate();
      if (!res.ok) {
        setErr(res.reason);
      } else {
        router.invalidate();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
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
            <Link to="/radar" className="text-white">Radar</Link>
            <Link to="/dashboard" className="transition hover:text-white">Dashboard</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          Tool 02 · Competitor Radar
        </div>
        <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight md:text-6xl">
          Wake up to a{" "}
          <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            1-page brief
          </span>{" "}
          on every competitor move.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-white/60">
          n8n scrapes changelogs, tweets, reviews, and job boards overnight. Gemini clusters the noise and tells
          you the &quot;so what?&quot; — every morning at 8 AM.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={onGenerate}
            disabled={busy}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-6 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Generating brief…" : "Generate today's brief"}
          </button>
          <span className="text-xs text-white/50">
            Pulls signals from the last 24h · {signals.length} recent
          </span>
        </div>
        {err && <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm text-red-200">{err}</div>}
      </section>

      {/* Latest brief */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest text-cyan-400">Latest brief</h2>
        {latest ? (
          <BriefCard brief={latest.brief} title={latest.title} createdAt={latest.createdAt} signalCount={latest.signalCount} />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-white/50">
            No brief yet. Ingest some signals via{" "}
            <code className="rounded bg-white/10 px-2 py-0.5 text-xs">POST /api/public/competitor-signals</code>{" "}
            then click &quot;Generate today&apos;s brief&quot;.
          </div>
        )}
      </section>

      {/* Recent signals + history */}
      <section className="border-t border-white/5 bg-white/[0.02] py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Recent signals (last 25)
            </h3>
            {signals.length === 0 ? (
              <p className="text-sm text-white/50">No signals ingested yet.</p>
            ) : (
              <ul className="space-y-2">
                {signals.map((s: typeof signals[number]) => (
                  <li key={s.id} className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="rounded bg-white/10 px-2 py-0.5 font-mono">{s.source_type}</span>
                      <span className="font-semibold text-white/80">{s.competitor_name}</span>
                      <span className="ml-auto">{new Date(s.created_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-white/90">
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {s.title}
                        </a>
                      ) : (
                        s.title
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Brief history
            </h3>
            {briefs.length === 0 ? (
              <p className="text-sm text-white/50">No briefs yet.</p>
            ) : (
              <ul className="space-y-2">
                {briefs.map((b: typeof briefs[number]) => (
                  <li key={b.id} className="rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                    <Link
                      to="/radar/$id"
                      params={{ id: b.id }}
                      className="flex items-center justify-between gap-3 hover:text-cyan-300"
                    >
                      <span>{b.title}</span>
                      <span className="text-xs text-white/40">
                        {b.signal_count} signals · {new Date(b.created_at).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Webhook docs */}
      <section className="border-t border-white/5 py-16">
        <div className="mx-auto max-w-4xl px-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">Wire it to n8n</h3>
          <p className="mb-4 text-sm text-white/60">
            Point your n8n scraper at these endpoints. Both need the{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">x-webhook-secret</code> header
            (same secret as PRD Autopilot).
          </p>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-white/80">
{`# 1. Ingest signals (called by n8n on every scrape)
POST /api/public/competitor-signals
{
  "signals": [
    { "competitor_name": "Linear", "source_type": "changelog",
      "title": "New triage view", "url": "https://...", "content": "..." }
  ]
}

# 2. Generate today's brief (called by n8n on a daily cron @ 7:55 AM)
POST /api/public/competitor-brief
→ { "id", "title", "signalCount", "shareUrl" }`}
          </pre>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-xs text-white/40">
        Built with n8n, Gemini, and Lovable · © Sachin Kumar Sharma 2026
      </footer>
    </div>
  );
}

export function BriefCard({
  brief,
  title,
  createdAt,
  signalCount,
}: {
  brief: BriefStruct;
  title: string;
  createdAt: string;
  signalCount: number;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 md:p-10">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>{title}</span>
        <span>
          {signalCount} signals · {new Date(createdAt).toLocaleString()}
        </span>
      </div>
      <h3 className="mt-3 text-3xl font-black leading-tight md:text-4xl">{brief.headline}</h3>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Section title="🚀 Shipped" empty="Nothing notable shipped." count={brief.shipped.length}>
          {brief.shipped.map((s, i) => (
            <Item key={i} title={`${s.competitor} — ${s.what}`} note={s.whySoWhat} url={s.url} />
          ))}
        </Section>
        <Section title="💰 Pricing moves" empty="No pricing changes." count={brief.pricingMoves.length}>
          {brief.pricingMoves.map((p, i) => (
            <Item key={i} title={`${p.competitor} — ${p.change}`} note={p.whySoWhat} />
          ))}
        </Section>
        <Section title="🔍 Negative signals" empty="No notable complaints." count={brief.negativeSignals.length}>
          {brief.negativeSignals.map((n, i) => (
            <Item key={i} title={`${n.competitor} — ${n.theme}`} note={`Opportunity: ${n.opportunity}`} />
          ))}
        </Section>
        <Section title="👥 Hiring signals" empty="No hiring signals." count={brief.hiringSignals.length}>
          {brief.hiringSignals.map((h, i) => (
            <Item key={i} title={`${h.competitor} — ${h.role}`} note={h.strategicMove} />
          ))}
        </Section>
      </div>

      <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-5">
        <div className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Today&apos;s takeaway</div>
        <p className="mt-2 text-base text-white/90">{brief.takeaway}</p>
      </div>
    </article>
  );
}

function Section({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-white/60">
        <span>{title}</span>
        <span className="text-white/30">{count}</span>
      </div>
      {count === 0 ? <p className="text-sm text-white/40">{empty}</p> : <div className="space-y-3">{children}</div>}
    </div>
  );
}

function Item({ title, note, url }: { title: string; note: string; url?: string }) {
  return (
    <div className="border-l-2 border-white/10 pl-3">
      <div className="text-sm font-semibold text-white/90">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300">
            {title} ↗
          </a>
        ) : (
          title
        )}
      </div>
      <div className="mt-1 text-xs text-white/60">{note}</div>
    </div>
  );
}
