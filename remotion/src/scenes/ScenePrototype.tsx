import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { fonts } from "../MainVideo";

const Tab: React.FC<{ label: string; active: boolean; delay: number }> = ({
  label,
  active,
  delay,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18 } });
  return (
    <div
      style={{
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
        padding: "14px 26px",
        borderRadius: 14,
        fontFamily: fonts.mono,
        fontSize: 20,
        background: active ? "linear-gradient(90deg,#22d3ee,#34d399)" : "rgba(255,255,255,0.05)",
        color: active ? "black" : "rgba(255,255,255,0.7)",
        border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
        fontWeight: 600,
      }}
    >
      {label}
    </div>
  );
};

export const ScenePrototype: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headS = spring({ frame, fps, config: { damping: 18 } });
  const titleS = spring({ frame: frame - 8, fps, config: { damping: 14 } });

  // mock browser appears
  const browserS = spring({ frame: frame - 50, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill style={{ padding: "90px 140px" }}>
      <div
        style={{
          opacity: interpolate(headS, [0, 1], [0, 1]),
          transform: `translateX(${interpolate(headS, [0, 1], [-40, 0])}px)`,
          fontFamily: fonts.mono,
          fontSize: 20,
          letterSpacing: 4,
          color: "#22d3ee",
          textTransform: "uppercase",
          marginBottom: 18,
        }}
      >
        Tool 03 · Prototype Generator
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
          marginBottom: 30,
        }}
      >
        Idea → <span style={{ color: "#22d3ee" }}>Working preview.</span>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
        <Tab label="HTML" active={true} delay={30} />
        <Tab label="React" active={false} delay={42} />
        <Tab label="Wireframe" active={false} delay={54} />
      </div>

      {/* Mock browser preview */}
      <div
        style={{
          opacity: interpolate(browserS, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(browserS, [0, 1], [80, 0])}px) scale(${interpolate(browserS, [0, 1], [0.95, 1])})`,
          background: "#0f1117",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 22,
          overflow: "hidden",
          maxWidth: 1500,
          boxShadow: "0 40px 100px rgba(34,211,238,0.18)",
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "16px 22px",
            background: "rgba(255,255,255,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 99, background: "#ff5f57" }} />
          <div style={{ width: 12, height: 12, borderRadius: 99, background: "#febc2e" }} />
          <div style={{ width: 12, height: 12, borderRadius: 99, background: "#28c840" }} />
          <div
            style={{
              marginLeft: 20,
              padding: "6px 18px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 8,
              fontFamily: fonts.mono,
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            preview://prototype.html
          </div>
        </div>
        {/* Mock app */}
        <div style={{ padding: "50px 60px" }}>
          {(() => {
            const navS = spring({ frame: frame - 80, fps, config: { damping: 18 } });
            return (
              <div
                style={{
                  opacity: navS,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 40,
                }}
              >
                <div style={{ fontFamily: fonts.display, fontSize: 28, fontWeight: 700 }}>SaaSly</div>
                <div style={{ display: "flex", gap: 30, color: "rgba(255,255,255,0.6)", fontSize: 18 }}>
                  <span>Features</span>
                  <span>Pricing</span>
                  <span>Docs</span>
                </div>
              </div>
            );
          })()}
          {(() => {
            const heroS = spring({ frame: frame - 100, fps, config: { damping: 16 } });
            return (
              <>
                <div
                  style={{
                    opacity: heroS,
                    transform: `translateY(${interpolate(heroS, [0, 1], [30, 0])}px)`,
                    fontFamily: fonts.display,
                    fontSize: 72,
                    fontWeight: 700,
                    lineHeight: 1.05,
                    letterSpacing: -2,
                    marginBottom: 24,
                  }}
                >
                  Ship your idea<br />
                  <span style={{ color: "#22d3ee" }}>before lunch.</span>
                </div>
                <div
                  style={{
                    opacity: heroS,
                    fontSize: 22,
                    color: "rgba(255,255,255,0.6)",
                    maxWidth: 700,
                    marginBottom: 36,
                  }}
                >
                  AI-generated working prototypes from a one-line idea.
                </div>
                <div
                  style={{
                    opacity: heroS,
                    display: "inline-block",
                    padding: "16px 32px",
                    background: "linear-gradient(90deg,#22d3ee,#34d399)",
                    color: "black",
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 20,
                  }}
                >
                  Get started →
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </AbsoluteFill>
  );
};
