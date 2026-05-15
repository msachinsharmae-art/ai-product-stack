import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateResearch, type ResearchResult } from "@/lib/research.functions";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Market Research — AI Product Ops Stack" },
      {
        name: "description",
        content:
          "Type a topic. Get a comprehensive market research brief with competitor landscape, trends and citations — powered by Tavily + Gemini.",
      },
      { property: "og:title", content: "Market Research — AI Product Ops Stack" },
      {
        property: "og:description",
        content: "Topic in. Strategic market brief with cited sources out. For PMs.",
      },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const run = useServerFn(generateResearch);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 3) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await run({ data: { topic: topic.trim() } });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-black">
              S
            </div>
            <span className="text-sm font-semibold tracking-tight">AI Product Ops Stack</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-white/60">
            <Link to="/demo" className="transition hover:text-white">PRD</Link>
            <Link to="/research" className="text-white">Research</Link>
            <Link to="/prototype" className="transition hover:text-white">Prototype</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Tool 02 · Market Research
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Comprehensive research, in 30 seconds.
        </h1>
        <p className="mt-4 max-w-2xl text-white/60">
          Type any topic, market or category. Tavily crawls the live web. Gemini synthesises a
          PM-grade brief: market size, trends, competitors, opportunities — with cited sources.
        </p>

        <form onSubmit={submit} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder='e.g. "AI note-taking apps for sales teams"'
            maxLength={300}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-base outline-none placeholder:text-white/30 focus:border-emerald-400/50"
          />
          <button
            type="submit"
            disabled={loading || topic.trim().length < 3}
            className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-4 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Researching…" : "Run research →"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-10 space-y-3">
            {["Searching the live web with Tavily…", "Reading top 10 sources…", "Gemini drafting market brief…"].map(
              (s, i) => (
                <div key={s} className="flex items-center gap-3 text-sm text-white/60">
                  <span
                    className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                  {s}
                </div>
              ),
            )}
          </div>
        )}

        {result && (
          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_280px]">
            <article className="prose prose-invert prose-sm max-w-none rounded-3xl border border-white/10 bg-white/[0.03] p-8 prose-headings:font-black prose-headings:tracking-tight prose-h2:text-emerald-300 prose-a:text-cyan-300">
              <Markdown text={result.markdown} />
            </article>
            <aside className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-white/50">
                Sources ({result.sources.length})
              </div>
              {result.sources.map((s, i) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
                >
                  <div className="font-mono text-[10px] text-emerald-400">[{i + 1}]</div>
                  <div className="mt-1 line-clamp-2 font-semibold text-white">{s.title}</div>
                  <div className="mt-1 truncate text-[10px] text-white/40">{new URL(s.url).hostname}</div>
                </a>
              ))}
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}

/** Tiny markdown renderer — headings, bullets, paragraphs, bold, links. */
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (!buf.length) return;
    out.push(<p key={out.length} dangerouslySetInnerHTML={{ __html: inline(buf.join(" ")) }} />);
    buf = [];
  };
  let i = 0;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#{1,6}\s/.test(line)) {
      flush();
      const level = line.match(/^#+/)![0].length;
      const text = line.replace(/^#+\s*/, "");
      const Tag = (`h${Math.min(level, 4)}`) as "h1" | "h2" | "h3" | "h4";
      out.push(<Tag key={i++} dangerouslySetInnerHTML={{ __html: inline(text) }} />);
    } else if (/^\s*[-*]\s/.test(line)) {
      flush();
      out.push(<li key={i++} dangerouslySetInnerHTML={{ __html: inline(line.replace(/^\s*[-*]\s/, "")) }} />);
    } else if (line.trim() === "") {
      flush();
    } else {
      buf.push(line);
    }
  }
  flush();
  return <>{out}</>;
}
function inline(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(\d+)\]/g, '<sup class="text-emerald-400">[$1]</sup>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}
