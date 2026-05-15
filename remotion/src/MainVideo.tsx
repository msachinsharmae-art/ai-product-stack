import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { TransitionSeries, springTiming, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { loadFont as loadDisplay } from "@remotion/google-fonts/SpaceGrotesk";
import { loadFont as loadBody } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

import { SceneHero } from "./scenes/SceneHero";
import { ScenePRD } from "./scenes/ScenePRD";
import { SceneResearch } from "./scenes/SceneResearch";
import { ScenePrototype } from "./scenes/ScenePrototype";
import { SceneOutro } from "./scenes/SceneOutro";

const display = loadDisplay("normal", { weights: ["500", "700"], subsets: ["latin"] });
const body = loadBody("normal", { weights: ["400", "600"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const fonts = {
  display: display.fontFamily,
  body: body.fontFamily,
  mono: mono.fontFamily,
};

// Persistent animated background
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = interpolate(frame, [0, durationInFrames], [0, 60]);
  const drift2 = interpolate(frame, [0, durationInFrames], [0, -80]);
  return (
    <AbsoluteFill style={{ background: "#06070d", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          left: -300 + drift,
          top: -400 + drift2 / 2,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at center, rgba(52,211,153,0.18), rgba(52,211,153,0) 60%)",
          filter: "blur(40px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1200,
          height: 1200,
          right: -200 + drift2,
          bottom: -300 + drift,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at center, rgba(34,211,238,0.14), rgba(34,211,238,0) 60%)",
          filter: "blur(40px)",
        }}
      />
      {/* grid */}
      <svg
        style={{ position: "absolute", inset: 0, opacity: 0.06 }}
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ fontFamily: fonts.body, color: "white" }}>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={170}>
          <SceneHero />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={185}>
          <ScenePRD />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 22 })}
        />
        <TransitionSeries.Sequence durationInFrames={195}>
          <SceneResearch />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 22 })}
        />
        <TransitionSeries.Sequence durationInFrames={195}>
          <ScenePrototype />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={195}>
          <SceneOutro />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
