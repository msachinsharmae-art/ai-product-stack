import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { fonts } from "../MainVideo";

export const SceneHero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowY = spring({ frame, fps, config: { damping: 18 } });
  const titleY = spring({ frame: frame - 10, fps, config: { damping: 16 } });
  const subY = spring({ frame: frame - 28, fps, config: { damping: 18 } });
  const lineW = spring({ frame: frame - 40, fps, config: { damping: 200 }, durationInFrames: 60 });

  const eyebrowOp = interpolate(eyebrowY, [0, 1], [0, 1]);
  const titleOp = interpolate(titleY, [0, 1], [0, 1]);
  const subOp = interpolate(subY, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ padding: "0 140px", justifyContent: "center" }}>
      <div
        style={{
          opacity: eyebrowOp,
          transform: `translateY(${interpolate(eyebrowY, [0, 1], [30, 0])}px)`,
          fontFamily: fonts.mono,
          fontSize: 22,
          letterSpacing: 6,
          color: "#34d399",
          textTransform: "uppercase",
          marginBottom: 32,
        }}
      >
        Built on Lovable · Free Stack
      </div>
      <div
        style={{
          opacity: titleOp,
          transform: `translateY(${interpolate(titleY, [0, 1], [60, 0])}px)`,
          fontFamily: fonts.display,
          fontWeight: 700,
          fontSize: 180,
          lineHeight: 0.95,
          letterSpacing: -4,
        }}
      >
        AI Product
        <br />
        <span
          style={{
            background: "linear-gradient(90deg,#34d399,#22d3ee)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Ops Stack.
        </span>
      </div>
      <div
        style={{
          marginTop: 42,
          height: 2,
          width: `${lineW * 480}px`,
          background: "linear-gradient(90deg,#34d399,#22d3ee)",
          borderRadius: 2,
        }}
      />
      <div
        style={{
          opacity: subOp,
          transform: `translateY(${interpolate(subY, [0, 1], [40, 0])}px)`,
          marginTop: 32,
          fontSize: 36,
          maxWidth: 1100,
          color: "rgba(255,255,255,0.72)",
          lineHeight: 1.3,
        }}
      >
        Three AI tools every Product Manager needs — in one place.
      </div>
    </AbsoluteFill>
  );
};
