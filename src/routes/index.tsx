import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Product Ops Stack — PRD Autopilot & Competitor Radar by Sachin Sharma" },
      {
        name: "description",
        content:
          "An open AI co-pilot for Product Managers and Business Analysts. Voice memos become PRDs. Competitors get tracked while you sleep. Built on n8n + Gemini.",
      },
      { property: "og:title", content: "AI Product Ops Stack — by Sachin Sharma" },
      {
        property: "og:description",
        content: "Voice memo → PRD. Daily competitor intel. An open AI co-pilot for PM, APM & BA roles.",
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
            <a href="#how" className="transition hover:text-white">How it works</a>
            <a href="#story" className="transition hover:text-white">Story</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>
          <a
            href="#contact"
            className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90"
          >
            Hire Sachin
          </a>
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
            user stories, acceptance criteria, and a Jira-ready epic. While I sleep, it briefs me on
            every competitor move.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/demo"
              className="rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-bold text-black transition hover:opacity-90"
            >
              Try the live demo →
            </Link>
            <a
              href="#tools"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              See the stack
            </a>
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
              Two workflows. Zero busywork.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* PRD Autopilot */}
            <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 transition hover:border-emerald-400/30">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Tool 01
              </div>
              <h3 className="text-3xl font-black tracking-tight">PRD Autopilot</h3>
              <p className="mt-3 text-white/60">
                Voice memo on a walk → fully structured PRD in Notion + Jira epic in Slack — in under 60 seconds.
              </p>

              <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-5 font-mono text-xs">
                <Step label="🎙️  Voice note" />
                <Pipe />
                <Step label="🔊  Whisper transcribe" />
                <Pipe />
                <Step label="🧠  Gemini → PRD template" />
                <Pipe />
                <Step label="📝  Notion + Jira + Slack" highlight />
              </div>

              <ul className="mt-6 space-y-2 text-sm text-white/70">
                <li>• Problem, Users, Goals, Non-goals</li>
                <li>• User stories with acceptance criteria</li>
                <li>• Success metrics + risk register</li>
              </ul>
            </article>

            {/* Competitor Radar */}
            <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-8 transition hover:border-cyan-400/30">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                Tool 02
              </div>
              <h3 className="text-3xl font-black tracking-tight">Competitor Radar</h3>
              <p className="mt-3 text-white/60">
                Every morning at 8 AM: a 1-page brief on what your top 5 competitors shipped, tweeted, and got reviewed for.
              </p>

              <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-5 font-mono text-xs">
                <Step label="⏰  Cron @ 7:55 AM" />
                <Pipe />
                <Step label="🌐  Scrape changelogs · G2 · Twitter" />
                <Pipe />
                <Step label="🧠  Gemini cluster + 'so what?'" />
                <Pipe />
                <Step label="📧  Email + Slack digest" highlight />
              </div>

              <ul className="mt-6 space-y-2 text-sm text-white/70">
                <li>• Feature launches & pricing changes</li>
                <li>• Negative review themes (your opportunity)</li>
                <li>• Hiring signals = strategic moves</li>
              </ul>
            </article>
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
              If you&apos;re hiring for <strong className="text-white">PM, APM, or Business Analyst</strong> roles
              and want someone who already speaks both customer and product — let&apos;s talk.
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
                Open to PM / APM / BA roles.
              </h2>
              <p className="mt-4 max-w-xl text-lg text-white/70">
                Currently shipping the AI Product Ops Stack in public. Available for full-time roles
                that value builders who think in systems.
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
                  href="mailto:hello@example.com"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Email me
                </a>
                <a
                  href="https://sachin289.app.n8n.cloud/mcp-server/http"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  See the n8n stack
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
