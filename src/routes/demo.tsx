import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import {
  generatePRD,
  pushToNotion,
  pushToGoogleDocs,
  pushToSlack,
  emailPRD,
  type PRDResult,
} from "@/lib/prd.functions";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "PRD Autopilot — Live Demo · Sachin Sharma" },
      {
        name: "description",
        content:
          "Record a 60-second voice memo. Get a fully structured PRD in seconds. Powered by Groq Whisper + Gemini 2.5.",
      },
    ],
  }),
  component: DemoPage,
});

type Status = "idle" | "recording" | "processing" | "done" | "error";

function DemoPage() {
  const generate = useServerFn(generatePRD);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [result, setResult] = useState<PRDResult | null>(null);
  const [textInput, setTextInput] = useState("");
  const [hint, setHint] = useState("");
  const [seconds, setSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    setErrorMsg("");
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
      };

      recorder.start();
      setStatus("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Microphone access denied.");
      setStatus("error");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("processing");
  };

  const processAudio = async (blob: Blob) => {
    try {
      const base64 = await blobToBase64(blob);
      const res = await generate({
        data: {
          audioBase64: base64,
          audioMimeType: blob.type,
          featureHint: hint || undefined,
        },
      });
      setResult(res);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const submitText = async () => {
    if (textInput.trim().length < 10) {
      setErrorMsg("Write at least 10 characters.");
      return;
    }
    setErrorMsg("");
    setStatus("processing");
    setResult(null);
    try {
      const res = await generate({
        data: { rawText: textInput, featureHint: hint || undefined },
      });
      setResult(res);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const handleUpload = async (file: File) => {
    setErrorMsg("");
    setResult(null);
    setStatus("processing");
    try {
      const base64 = await blobToBase64(file);
      const res = await generate({
        data: {
          audioBase64: base64,
          audioMimeType: file.type || "audio/mpeg",
          featureHint: hint || undefined,
        },
      });
      setResult(res);
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  };

  const downloadMarkdown = () => {
    if (!result) return;
    const blob = new Blob([result.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(result.prd.title)}-PRD.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 text-sm font-black text-black">
              S
            </div>
            <span className="text-sm font-semibold">AI Product Ops Stack</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-white/60 hover:text-white">
              History
            </Link>
            <Link to="/" className="text-sm text-white/60 hover:text-white">
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live · PRD Autopilot v1
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight md:text-5xl">
          Speak it. Ship it.
        </h1>
        <p className="mt-4 text-lg text-white/60">
          Record a voice memo, upload audio, or paste rough notes. Get a fully structured PRD in
          ~15 seconds.
        </p>

        {/* Optional hint */}
        <div className="mt-10">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Feature context (optional)
          </label>
          <input
            type="text"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="e.g. Mobile fintech app for Gen Z"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-white/30 focus:border-emerald-400/50 focus:outline-none"
            disabled={status === "recording" || status === "processing"}
          />
        </div>

        {/* Input methods */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {/* Record */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              🎙️ Record
            </div>
            <p className="mt-2 text-xs text-white/50">Use your mic.</p>
            <div className="mt-4">
              {status === "recording" ? (
                <button
                  onClick={stopRecording}
                  className="w-full rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-600"
                >
                  ⏹ Stop · {formatTime(seconds)}
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={status === "processing"}
                  className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-40"
                >
                  Start recording
                </button>
              )}
            </div>
          </div>

          {/* Upload */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              📎 Upload
            </div>
            <p className="mt-2 text-xs text-white/50">mp3, m4a, wav, webm</p>
            <label className="mt-4 block cursor-pointer rounded-full border border-white/15 bg-white/5 px-4 py-2 text-center text-sm font-semibold transition hover:bg-white/10">
              Choose file
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                disabled={status === "recording" || status === "processing"}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
            </label>
          </div>

          {/* Text */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-fuchsia-400">
              ⌨️ Type
            </div>
            <p className="mt-2 text-xs text-white/50">Paste rough notes.</p>
            <button
              onClick={() => document.getElementById("text-area")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-4 w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
            >
              Jump to textbox ↓
            </button>
          </div>
        </div>

        {/* Text area */}
        <div id="text-area" className="mt-8">
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Or paste your idea / notes
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={5}
            placeholder="e.g. We need a way for users to schedule recurring orders. Right now they have to re-enter every week. Should support pause, skip, and edit. Probably needs notifications too..."
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm placeholder:text-white/30 focus:border-fuchsia-400/50 focus:outline-none"
            disabled={status === "recording" || status === "processing"}
          />
          <button
            onClick={submitText}
            disabled={status === "recording" || status === "processing" || textInput.length < 10}
            className="mt-3 rounded-full bg-white px-6 py-2 text-sm font-bold text-black transition hover:bg-white/90 disabled:opacity-40"
          >
            Generate PRD from text →
          </button>
        </div>

        {/* Status / Error */}
        {status === "processing" && (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
            <p className="mt-4 text-sm text-white/70">
              Transcribing with Groq · Reasoning with Gemini 2.5...
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Result */}
        {result && status === "done" && (
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black tracking-tight">✨ Your PRD is ready</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/p/${result.id}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
                >
                  🔗 Copy share link
                </button>
                <a
                  href={`/p/${result.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10"
                >
                  ↗ Open share page
                </a>
                <button
                  onClick={downloadMarkdown}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-bold text-black transition hover:bg-emerald-300"
                >
                  ↓ Download .md
                </button>
              </div>
            </div>

            <Destinations prdId={result.id} />

            <PRDView result={result} />
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-white/40">
        Built with Groq Whisper + Lovable AI (Gemini 2.5) · © Sachin Kumar Sharma
      </footer>
    </div>
  );
}

function PRDView({ result }: { result: PRDResult }) {
  const { prd, transcript } = result;
  return (
    <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Title
        </div>
        <h3 className="mt-2 text-3xl font-black">{prd.title}</h3>
      </div>

      <Section label="Problem">{prd.problem}</Section>
      <Section label="Target Users">{prd.targetUsers}</Section>

      <List label="Goals" items={prd.goals} accent="emerald" />
      <List label="Non-Goals" items={prd.nonGoals} accent="rose" />

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          User Stories
        </div>
        <div className="mt-3 space-y-4">
          {prd.userStories.map((us, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="text-sm font-semibold text-white">{us.story}</div>
              <ul className="mt-3 space-y-1 text-sm text-white/70">
                {us.acceptanceCriteria.map((ac, j) => (
                  <li key={j}>✓ {ac}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <List label="Success Metrics" items={prd.successMetrics} accent="cyan" />
      <List label="Risks" items={prd.risks} accent="amber" />
      <List label="Open Questions" items={prd.openQuestions} accent="fuchsia" />

      <details className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-white/70">
          View original transcript
        </summary>
        <p className="mt-3 whitespace-pre-wrap text-white/60">{transcript}</p>
      </details>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</div>
      <p className="mt-2 text-base text-white/85">{children}</p>
    </div>
  );
}

function List({
  label,
  items,
  accent,
}: {
  label: string;
  items: string[];
  accent: "emerald" | "rose" | "cyan" | "amber" | "fuchsia";
}) {
  const colorMap = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    cyan: "text-cyan-400",
    amber: "text-amber-400",
    fuchsia: "text-fuchsia-400",
  };
  return (
    <div>
      <div className={`text-xs font-semibold uppercase tracking-wider ${colorMap[accent]}`}>
        {label}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm text-white/80">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-white/30">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "prd";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip "data:audio/webm;base64,"
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

type DestState = {
  notion: { status: "idle" | "loading" | "done" | "error"; url?: string; error?: string };
  gdocs: { status: "idle" | "loading" | "done" | "error"; url?: string; error?: string };
  slack: { status: "idle" | "loading" | "done" | "error"; error?: string };
};

function Destinations({ prdId }: { prdId: string }) {
  const notionFn = useServerFn(pushToNotion);
  const gdocsFn = useServerFn(pushToGoogleDocs);
  const slackFn = useServerFn(pushToSlack);
  const [channel, setChannel] = useState("general");
  const [s, setS] = useState<DestState>({
    notion: { status: "idle" },
    gdocs: { status: "idle" },
    slack: { status: "idle" },
  });

  const runNotion = async () => {
    setS((p) => ({ ...p, notion: { status: "loading" } }));
    try {
      const r = await notionFn({ data: { prdId } });
      setS((p) => ({ ...p, notion: { status: "done", url: r.url } }));
    } catch (e) {
      setS((p) => ({ ...p, notion: { status: "error", error: e instanceof Error ? e.message : "Failed" } }));
    }
  };
  const runGdocs = async () => {
    setS((p) => ({ ...p, gdocs: { status: "loading" } }));
    try {
      const r = await gdocsFn({ data: { prdId } });
      setS((p) => ({ ...p, gdocs: { status: "done", url: r.url } }));
    } catch (e) {
      setS((p) => ({ ...p, gdocs: { status: "error", error: e instanceof Error ? e.message : "Failed" } }));
    }
  };
  const runSlack = async () => {
    setS((p) => ({ ...p, slack: { status: "loading" } }));
    try {
      await slackFn({ data: { prdId, channel } });
      setS((p) => ({ ...p, slack: { status: "done" } }));
    } catch (e) {
      setS((p) => ({ ...p, slack: { status: "error", error: e instanceof Error ? e.message : "Failed" } }));
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 p-6">
      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
        Ship it everywhere
      </div>
      <p className="mt-1 text-sm text-white/60">
        One click → Notion page, Google Doc, and Slack notification.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <DestCard
          label="Notion"
          icon="📝"
          state={s.notion}
          onClick={runNotion}
          ctaIdle="Push to Notion"
          ctaDone="Open in Notion"
        />
        <DestCard
          label="Google Docs"
          icon="📄"
          state={s.gdocs}
          onClick={runGdocs}
          ctaIdle="Create Google Doc"
          ctaDone="Open Google Doc"
        />
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span>💬</span> Slack
          </div>
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="channel"
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs placeholder:text-white/30 focus:border-emerald-400/50 focus:outline-none"
            disabled={s.slack.status === "loading"}
          />
          <button
            onClick={runSlack}
            disabled={s.slack.status === "loading" || !channel.trim()}
            className="mt-2 w-full rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black transition hover:bg-white/90 disabled:opacity-40"
          >
            {s.slack.status === "loading"
              ? "Sending…"
              : s.slack.status === "done"
              ? `✓ Sent to #${channel}`
              : "Send to Slack"}
          </button>
          {s.slack.status === "error" && (
            <p className="mt-2 text-[11px] text-red-300">{s.slack.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DestCard({
  label,
  icon,
  state,
  onClick,
  ctaIdle,
  ctaDone,
}: {
  label: string;
  icon: string;
  state: { status: "idle" | "loading" | "done" | "error"; url?: string; error?: string };
  onClick: () => void;
  ctaIdle: string;
  ctaDone: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-sm font-bold">
        <span>{icon}</span> {label}
      </div>
      <p className="mt-2 h-8 text-[11px] text-white/40">
        {state.status === "done" ? "Successfully created." : "Sync this PRD."}
      </p>
      {state.status === "done" && state.url ? (
        <a
          href={state.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 block w-full rounded-full bg-emerald-400 px-3 py-1.5 text-center text-xs font-bold text-black transition hover:bg-emerald-300"
        >
          ↗ {ctaDone}
        </a>
      ) : (
        <button
          onClick={onClick}
          disabled={state.status === "loading"}
          className="mt-1 w-full rounded-full bg-white px-3 py-1.5 text-xs font-bold text-black transition hover:bg-white/90 disabled:opacity-40"
        >
          {state.status === "loading" ? "Working…" : ctaIdle}
        </button>
      )}
      {state.status === "error" && (
        <p className="mt-2 text-[11px] text-red-300">{state.error}</p>
      )}
    </div>
  );
}
