import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PRD Autopilot — AI Product Ops by Sachin Sharma" },
      {
        name: "description",
        content:
          "An open AI co-pilot for Product Managers. Voice memos become structured PRDs in under 60 seconds. Built on n8n + Gemini.",
      },
      { property: "og:title", content: "PRD Autopilot — by Sachin Sharma" },
      {
        property: "og:description",
        content: "Voice memo → PRD in 60 seconds. An open AI co-pilot for PM, APM & BA roles.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white antialiased">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-black">
              S
            </div>
            <span className="text-sm font-semibold tracking-tight">AI Product Ops Stack</span>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
            <a href="#tools" className="transition hover:text-white">Tools</a>
            <Link to="/demo" className="transition hover:text-white">PRD</Link>
            <Link to="/research" className="transition hover:text-white">Research</Link>
            <Link to="/prototype" className="transition hover:text-white">Prototype</Link>
            <a href="#story" className="transition hover:text-white">Story</a>
          </nav>
          <Link
            to="/demo"
            className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
          >
            Try it →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live · PRD Autopilot v1 shipped
          </div>

          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
            The AI co-pilot every{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              Product Manager
            </span>{" "}
            secretly wants.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-white/60 md:text-xl">
            I ramble into my phone for 90 seconds. n8n + Gemini turns it into a 4-page PRD,
            user stories, acceptance criteria, and a Jira-ready epic.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/demo"
              className="rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-bold text-black transition hover:opacity-90"
            >
              Try PRD Autopilot →
            </Link>
            <a
              href="#tools"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/5"
            >
              See how it works
            </a>
          </div>

          {/* Destinations row */}
          <div className="mt-8 flex flex-wrap items-center gap-2 text-xs text-white/50">
            <span className="uppercase tracking-widest text-white/40">Ships to</span>
            {["Notion", "Google Docs", "Slack", "Email", "Telegram", "Share link"].map((d) => (
              <span key={d} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                {d}
              </span>
            ))}
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-4">
            {[
              { k: "90s", v: "Voice → PRD" },
              { k: "8 AM", v: "Daily competitor brief" },
              { k: "6 hrs", v: "Saved per week" },
              { k: "100%", v: "Open source" },
            ].map((s) => (
              <div key={s.v} className="bg-[#0a0a0f] p-6">
                <div className="text-3xl font-black tracking-tight text-white">{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-white/50">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">The Stack</div>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              Three tools. One product brain.
            </h2>
            <p className="mt-3 text-white/60">From spec to research to prototype — without leaving the browser.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <ToolCard
              n="01"
              to="/demo"
              title="PRD Autopilot"
              tag="Spec"
              desc="Voice memo → fully structured PRD in Notion + Slack in under 60 seconds."
              cta="Open PRD →"
            />
            <ToolCard
              n="02"
              to="/research"
              title="Market Research"
              tag="Research"
              desc="Topic in. Cited market brief out — competitors, trends, opportunities. Tavily + Gemini."
              cta="Run research →"
            />
            <ToolCard
              n="03"
              to="/prototype"
              title="Prototype Generator"
              tag="Build"
              desc="Idea in. Live HTML prototype, React snippet, or wireframe image — your pick."
              cta="Generate prototype →"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-white/5 bg-white/[0.02] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-cyan-400">How it works</div>
            <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              One n8n workflow. Three superpowers.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Capture",
                d: "Telegram bot or web form. Speak, type, or paste. The agent never sleeps.",
              },
              {
                n: "02",
                t: "Reason",
                d: "Gemini 2.5 structures the input against battle-tested PM templates — STAR, RICE, JTBD.",
              },
              {
                n: "03",
                t: "Distribute",
                d: "Outputs land in Notion, Jira, Slack, Email — wherever your team already lives.",
              },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="text-5xl font-black text-white/10">{s.n}</div>
                <div className="mt-3 text-xl font-bold">{s.t}</div>
                <p className="mt-2 text-sm text-white/60">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section id="story" className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">The Why</div>
          <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
            From debugging at 2 AM to shipping AI for PMs.
          </h2>

          <div className="mt-8 space-y-5 text-lg leading-relaxed text-white/70">
            <p>
              I&apos;m <strong className="text-white">Sachin Kumar Sharma</strong> — Customer Success leader
              transitioning into Product Management. Years of sitting between customers and product taught me
              one thing: most PM workflows are broken in ways AI can finally fix.
            </p>
            <p>
              I&apos;ve lived the pain on both sides — chasing roadmaps for frustrated customers, translating
              vague feedback into PRDs nobody reads. So instead of waiting for a recruiter callback,
              I&apos;m building the AI Product Ops Stack in public — open-source, free, and built on real
              CS-to-Product problems.
            </p>
            <p>
              If you&apos;re building in <strong className="text-white">product, AI, or customer-led growth</strong>{" "}
              and want to swap notes — or just nerd out on workflows that make PMs faster — let&apos;s connect.
            </p>
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="border-t border-white/5 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 p-10 md:p-14">
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">
                Let&apos;s build something together.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/70">
                I share what I ship — workflows, PRDs, the messy in-between.
                If any of it sparks a conversation, my inbox is open.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://www.linkedin.com/in/sachin289"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-white/90"
                >
                  LinkedIn →
                </a>
                <a
                  href="mailto:msachinsharmae@gmail.com"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Email me
                </a>
                <a
                  href="https://github.com/msachinsharmae-art"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  View GitHub stack →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 text-center text-xs text-white/40">
        Built with n8n, Gemini, and Lovable · © Sachin Kumar Sharma 2026
      </footer>
    </div>
  );
}

function Step({ label, highlight = false }: { label: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        highlight
          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
          : "border-white/10 bg-white/5 text-white/80"
      }`}
    >
      {label}
    </div>
  );
}

function Pipe() {
  return <div className="ml-4 h-3 w-px bg-white/15" />;
}
