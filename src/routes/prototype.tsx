import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generatePrototype, type PrototypeResult } from "@/lib/prototype.functions";

export const Route = createFileRoute("/prototype")({
  head: () => ({
    meta: [
      { title: "Prototype Generator — AI Product Ops Stack" },
      {
        name: "description",
        content:
          "Describe an idea. Get a clickable HTML prototype, a React snippet, or a UI wireframe image — instantly.",
      },
      { property: "og:title", content: "Prototype Generator — AI Product Ops Stack" },
      {
        property: "og:description",
        content: "Idea in. Working prototype out. HTML, React, or wireframe.",
      },
    ],
  }),
  component: PrototypePage,
});

type Format = "html" | "react" | "wireframe";

function PrototypePage() {
  const run = useServerFn(generatePrototype);
  const [idea, setIdea] = useState("");
  const [format, setFormat] = useState<Format>("html");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PrototypeResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length < 5) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await run({ data: { idea: idea.trim(), format } });
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-black">
              S
            </div>
            <span className="text-sm font-semibold tracking-tight">AI Product Ops Stack</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-white/60">
            <Link to="/demo" className="transition hover:text-white">PRD</Link>
            <Link to="/research" className="transition hover:text-white">Research</Link>
            <Link to="/prototype" className="text-white">Prototype</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
          Tool 03 · Prototype Generator
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Idea → working prototype.
        </h1>
        <p className="mt-4 max-w-2xl text-white/60">
          Describe what you want to build. Pick a format. Get a live HTML prototype you can preview,
          or a React component you can paste into your codebase.
        </p>


        <form onSubmit={submit} className="mt-10 space-y-4">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={`e.g. "A dashboard for SDRs showing their pipeline, today's tasks, and AI-suggested follow-ups"`}
            rows={4}
            maxLength={2000}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-base outline-none placeholder:text-white/30 focus:border-emerald-400/50"
          />

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "html" as const, label: "HTML preview", desc: "Live, in-page" },
                  { id: "react" as const, label: "React snippet", desc: "Copy-paste" },
                ]
              ).map((opt) => (

                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormat(opt.id)}
                  className={`rounded-xl border px-4 py-2 text-left text-xs transition ${
                    format === opt.id
                      ? "border-emerald-400/50 bg-emerald-400/10 text-white"
                      : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                  }`}
                >
                  <div className="font-bold">{opt.label}</div>
                  <div className="text-[10px] opacity-70">{opt.desc}</div>
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || idea.trim().length < 5}
              className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "Generating…" : "Generate prototype →"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-10 text-sm text-white/60">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {format === "wireframe"
              ? "Rendering UI wireframe with Gemini Image…"
              : "Designing prototype with Gemini…"}
          </div>
        )}

        {result && <PrototypeOutput result={result} />}
      </section>
    </div>
  );
}

function PrototypeOutput({ result }: { result: PrototypeResult }) {


  if (result.format === "html" && result.html) {
    return (
      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-white/50">Live preview</div>
          <button
            onClick={() => navigator.clipboard.writeText(result.html!)}
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            Copy HTML
          </button>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white">
          <iframe
            title="prototype"
            srcDoc={result.html}
            sandbox="allow-scripts"
            className="h-[700px] w-full border-0"
          />
        </div>
        <details className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <summary className="cursor-pointer text-xs uppercase tracking-widest text-white/50">
            View HTML source
          </summary>
          <pre className="mt-3 max-h-[400px] overflow-auto text-xs text-white/70">
            <code>{result.html}</code>
          </pre>
        </details>
      </div>
    );
  }

  if (result.format === "react" && result.react) {
    return (
      <div className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-widest text-white/50">React component</div>
          <button
            onClick={() => navigator.clipboard.writeText(result.react!)}
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            Copy code
          </button>
        </div>
        <pre className="max-h-[700px] overflow-auto rounded-3xl border border-white/10 bg-black/60 p-6 text-xs leading-relaxed text-white/80">
          <code>{result.react}</code>
        </pre>
      </div>
    );
  }
  return null;
}
