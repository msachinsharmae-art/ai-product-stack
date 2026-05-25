import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { fonts } from "../MainVideo";

const Chip: React.FC<{ label: string; sub: string; color: string; delay: number }> = ({
  label,
  sub,
  color,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px) scale(${interpolate(s, [0, 1], [0.85, 1])})`,
        padding: "22px 28px",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${color}55`,
        borderRadius: 18,
        minWidth: 240,
      }}
    >
      <div style={{ fontFamily: fonts.mono, fontSize: 14, letterSpacing: 3, color, textTransform: "uppercase" }}>
        {sub}
      </div>
      <div style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 700, marginTop: 6 }}>{label}</div>
    </div>
  );
};

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const eyebrowS = spring({ frame, fps, config: { damping: 18 } });
  const titleS = spring({ frame: frame - 10, fps, config: { damping: 14 } });
  const freeS = spring({ frame: frame - 130, fps, config: { damping: 12 } });
  const urlS = spring({ frame: frame - 150, fps, config: { damping: 18 } });

  return (
    <AbsoluteFill style={{ padding: "0 140px", justifyContent: "center" }}>
      <div
        style={{
          opacity: interpolate(eyebrowS, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(eyebrowS, [0, 1], [-30, 0])}px)`,
          fontFamily: fonts.mono,
          fontSize: 22,
          letterSpacing: 6,
          color: "#34d399",
          textTransform: "uppercase",
          marginBottom: 30,
        }}
      >
        The Stack · 100% Free Tier
      </div>
      <div
        style={{
          opacity: interpolate(titleS, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleS, [0, 1], [50, 0])}px)`,
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 140,
          lineHeight: 0.95,
          letterSpacing: -3,
          marginBottom: 60,
        }}
      >
        Built with{" "}
        <span
          style={{
            background: "linear-gradient(90deg,#34d399,#22d3ee)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          zero $.
        </span>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 60 }}>
        <Chip sub="Frontend + SSR" label="Lovable + TanStack" color="#34d399" delay={40} />
        <Chip sub="Database + Auth" label="Lovable Cloud" color="#22d3ee" delay={56} />
        <Chip sub="LLM (Gemini 2.5)" label="Lovable AI" color="#a78bfa" delay={72} />
        <Chip sub="Web Search" label="Tavily API" color="#f472b6" delay={88} />
        <Chip sub="Voice → Text" label="Groq Whisper" color="#fbbf24" delay={104} />
      </div>

      <div
        style={{
          opacity: interpolate(freeS, [0, 1], [0, 1]),
          transform: `scale(${interpolate(freeS, [0, 1], [0.9, 1])})`,
          fontSize: 38,
          color: "rgba(255,255,255,0.8)",
          marginBottom: 30,
        }}
      >
        Voice → PRD · Topic → Brief · Idea → Prototype.
      </div>
      <div
        style={{
          opacity: interpolate(urlS, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(urlS, [0, 1], [20, 0])}px)`,
          fontFamily: fonts.mono,
          fontSize: 30,
          color: "#34d399",
          letterSpacing: 1,
        }}
      >
        ai-product-stack.lovable.app
      </div>
    </AbsoluteFill>
  );
};
