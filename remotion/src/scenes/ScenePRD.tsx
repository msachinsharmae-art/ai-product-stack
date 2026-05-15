import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import { fonts } from "../MainVideo";

const ToolHeader: React.FC<{ num: string; label: string; color: string }> = ({
  num,
  label,
  color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = spring({ frame, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        opacity: op,
        transform: `translateX(${interpolate(op, [0, 1], [-40, 0])}px)`,
        fontFamily: fonts.mono,
        fontSize: 20,
        letterSpacing: 4,
        color,
        textTransform: "uppercase",
        marginBottom: 24,
      }}
    >
      Tool {num} · {label}
    </div>
  );
};

const Title: React.FC<{ text: string; delay?: number }> = ({ text, delay = 6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px)`,
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: 130,
        lineHeight: 0.95,
        letterSpacing: -3,
        marginBottom: 36,
      }}
    >
      {text}
    </div>
  );
};

const Bullet: React.FC<{ text: string; delay: number; accent: string }> = ({
  text,
  delay,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateX(${interpolate(s, [0, 1], [-30, 0])}px)`,
        display: "flex",
        alignItems: "center",
        gap: 18,
        fontSize: 32,
        marginBottom: 18,
        color: "rgba(255,255,255,0.9)",
      }}
    >
      <div style={{ width: 10, height: 10, borderRadius: 99, background: accent }} />
      {text}
    </div>
  );
};

export const ScenePRD: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardS = spring({ frame: frame - 30, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ padding: "100px 140px", justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <div>
          <ToolHeader num="01" label="PRD Autopilot" color="#a78bfa" />
          <Title text="Voice → PRD." />
          <Bullet text="Drop a transcript or voice note" delay={36} accent="#a78bfa" />
          <Bullet text="Gemini drafts a structured spec" delay={50} accent="#a78bfa" />
          <Bullet text="Shareable link, instantly" delay={64} accent="#a78bfa" />
        </div>
        <div
          style={{
            opacity: interpolate(cardS, [0, 1], [0, 1]),
            transform: `translateY(${interpolate(cardS, [0, 1], [60, 0])}px) rotate(-1.5deg)`,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(167,139,250,0.3)",
            borderRadius: 24,
            padding: 36,
            fontFamily: fonts.mono,
            fontSize: 18,
            color: "rgba(255,255,255,0.85)",
            boxShadow: "0 30px 80px rgba(167,139,250,0.15)",
          }}
        >
          <div style={{ color: "#a78bfa", marginBottom: 20, letterSpacing: 2 }}># PRD · OnboardingFlow</div>
          {[
            "## Problem",
            "Users drop off at step 3.",
            "",
            "## Goals",
            "- Reduce drop-off by 30%",
            "- Time-to-value < 60s",
            "",
            "## User Stories",
            "- As a new user, I can…",
            "- As a returning user, I…",
            "",
            "## Success Metrics",
            "Activation rate, D1 retention",
          ].map((l, i) => {
            const lineS = spring({
              frame: frame - 60 - i * 4,
              fps,
              config: { damping: 200 },
              durationInFrames: 18,
            });
            return (
              <div key={i} style={{ opacity: lineS, lineHeight: 1.7 }}>
                {l || "\u00A0"}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
