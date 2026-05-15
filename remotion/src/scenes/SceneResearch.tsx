import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { fonts } from "../MainVideo";

const Source: React.FC<{ index: number; title: string; host: string; delay: number }> = ({
  index,
  title,
  host,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(52,211,153,0.25)",
        borderRadius: 14,
        padding: "14px 18px",
        marginBottom: 12,
      }}
    >
      <div style={{ fontFamily: fonts.mono, fontSize: 14, color: "#34d399" }}>[{index}]</div>
      <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2 }}>{title}</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{host}</div>
    </div>
  );
};

export const SceneResearch: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headS = spring({ frame, fps, config: { damping: 18 } });
  const titleS = spring({ frame: frame - 8, fps, config: { damping: 14 } });
  const briefS = spring({ frame: frame - 30, fps, config: { damping: 18 } });

  // typing query
  const queryFull = '"AI note-taking apps for sales teams"';
  const charCount = Math.min(
    queryFull.length,
    Math.max(0, Math.floor(interpolate(frame, [50, 110], [0, queryFull.length])))
  );
  const query = queryFull.slice(0, charCount);

  // pipeline ticks
  const steps = ["Searching the live web with Tavily…", "Reading top 10 sources…", "Gemini drafting brief…"];

  return (
    <AbsoluteFill style={{ padding: "90px 140px" }}>
      <div
        style={{
          opacity: interpolate(headS, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(headS, [0, 1], [-40, 0])}px)`,
          fontFamily: fonts.mono,
          fontSize: 20,
          letterSpacing: 4,
          color: "#34d399",
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        Tool 02 · Market Research
      </div>
      <div
        style={{
          opacity: interpolate(titleS, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleS, [0, 1], [40, 0])}px)`,
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 110,
          letterSpacing: -3,
          lineHeight: 0.95,
          marginBottom: 36,
        }}
      >
        Topic in. <span style={{ color: "#34d399" }}>Brief out.</span>
      </div>

      {/* Search bar */}
      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 18,
          padding: "22px 28px",
          fontFamily: fonts.mono,
          fontSize: 28,
          color: "white",
          marginBottom: 28,
          maxWidth: 1100,
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.4)" }}>topic ▸ </span>
        {query}
        <span style={{ opacity: (Math.floor(frame / 8) % 2) }}>|</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 50 }}>
        {/* Pipeline + brief */}
        <div>
          {steps.map((s, i) => {
            const sp = spring({
              frame: frame - 90 - i * 12,
              fps,
              config: { damping: 18 },
            });
            return (
              <div
                key={i}
                style={{
                  opacity: interpolate(sp, [0, 1], [0, 1]),
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  fontSize: 26,
                  marginBottom: 14,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 99,
                    background: "#34d399",
                    boxShadow: "0 0 20px #34d399",
                  }}
                />
                {s}
              </div>
            );
          })}
          <div
            style={{
              opacity: interpolate(briefS, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(briefS, [0, 1], [40, 0])}px)`,
              marginTop: 30,
              padding: 30,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              fontSize: 22,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <div style={{ color: "#34d399", fontFamily: fonts.display, fontSize: 32, fontWeight: 700, marginBottom: 12 }}>
              ## Executive Summary
            </div>
            The market for AI-augmented sales tooling is growing 40% YoY [1].
            Key segments: <strong>conversation intelligence</strong>,{" "}
            <strong>auto-CRM</strong>, and <strong>note-capture</strong> [2][3]…
          </div>
        </div>
        {/* Sources */}
        <div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              letterSpacing: 4,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            Sources (10)
          </div>
          <Source index={1} title="State of AI Sales Tools 2026" host="gartner.com" delay={120} />
          <Source index={2} title="Conversation Intelligence Report" host="forrester.com" delay={132} />
          <Source index={3} title="Note-Capture Market Brief" host="tracxn.com" delay={144} />
          <Source index={4} title="Sales Productivity Benchmarks" host="hbr.org" delay={156} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
