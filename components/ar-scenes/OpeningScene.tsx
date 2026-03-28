import {
  ViroARImageMarker,
  ViroARScene,
  ViroARTrackingTargets,
  ViroMaterials,
  ViroNode,
  ViroPolyline,
} from "@reactvision/react-viro";
import React, { useState } from "react";
import { NormalizedStroke } from "./DrawingCanvas";

// ─── Materiale ─────────────────────────────────────────────────────────────────

ViroMaterials.createMaterials({
  redLine: { diffuseColor: "#FF0055" },
  greenLine: { diffuseColor: "#00FF00" },
  cyanLine: { diffuseColor: "#00FFFF" },
  yellowLine: { diffuseColor: "#FFFF00" },
  orangeLine: { diffuseColor: "#FF6600" },
  whiteLine: { diffuseColor: "#FFFFFF" },
});

const COLOR_TO_MATERIAL: { [hex: string]: string } = {
  "#FF0055": "redLine",
  "#00FF00": "greenLine",
  "#00FFFF": "cyanLine",
  "#FFFF00": "yellowLine",
  "#FF6600": "orangeLine",
  "#FFFFFF": "whiteLine",
};

const getMaterial = (hex: string) => COLOR_TO_MATERIAL[hex] ?? "whiteLine";

// ─── Tracking targets ──────────────────────────────────────────────────────────

const MARKER_WIDTH = 0.21;
// --- MODIFICARE 1: Adăugăm înălțimea corespunzătoare formatului de poster (aprox 1:1.33)
const MARKER_HEIGHT = 0.28;

ViroARTrackingTargets.createTargets({
  poster1: {
    source: require("../../assets/afise/afis1.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
  poster2: {
    source: require("../../assets/afise/afis2.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
  poster3: {
    source: require("../../assets/afise/afis3.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
  poster4: {
    source: require("../../assets/afise/afis4.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
  poster5: {
    source: require("../../assets/afise/afis5.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
  poster6: {
    source: require("../../assets/afise/afis6.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
  poster7: {
    source: require("../../assets/afise/afis7.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
  poster8: {
    source: require("../../assets/afise/afis8.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
  poster9: {
    source: require("../../assets/afise/afis9.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
  poster10: {
    source: require("../../assets/afise/afis10.png"),
    orientation: "Up",
    physicalWidth: MARKER_WIDTH,
  },
});

// ─── Helper: normalizat → coordonate AR ───────────────────────────────────────

// --- MODIFICARE 2: Folosim MARKER_HEIGHT pentru axa Y (înălțime) ---
const normalizedToAR = (
  pts: { nx: number; ny: number }[],
): [number, number, number][] =>
  pts.map(({ nx, ny }) => [
    (nx - 0.5) * MARKER_WIDTH,
    (0.5 - ny) * MARKER_HEIGHT, // <-- Acum se întinde corect pe verticală!
    0,
  ]);

const POSTER_CONFIGS = Array.from({ length: 10 }, (_, i) => ({
  target: `poster${i + 1}` as const,
  name: `Poster ${i + 1}`,
}));

// ─── Scenă ────────────────────────────────────────────────────────────────────

const OpeningScene = (props: any) => {
  const { drawings, onPosterFound, onPosterLost } =
    props.arSceneNavigator?.viroAppProps ?? {};

  const [trackedPosters, setTrackedPosters] = useState<{
    [key: string]: boolean;
  }>({});

  return (
    <ViroARScene>
      {POSTER_CONFIGS.map((config) => {
        const posterStrokes: NormalizedStroke[] | undefined =
          drawings?.[config.name];

        const isCurrentlyTracked = trackedPosters[config.name] || false;

        return (
          <ViroARImageMarker
            key={config.target}
            target={config.target}
            onAnchorFound={() => {
              setTrackedPosters((prev) => ({ ...prev, [config.name]: true }));
              onPosterFound && onPosterFound(config.name);
            }}
            onAnchorUpdated={(anchor) => {
              if (anchor.trackingMethod === "tracking") {
                setTrackedPosters((prev) => ({ ...prev, [config.name]: true }));
                onPosterFound && onPosterFound(config.name);
              } else {
                setTrackedPosters((prev) => ({
                  ...prev,
                  [config.name]: false,
                }));
                onPosterLost && onPosterLost(config.name);
              }
            }}
          >
            {posterStrokes &&
              posterStrokes.length > 0 &&
              isCurrentlyTracked && (
                <ViroNode rotation={[-90, 0, 0]}>
                  {posterStrokes
                    .filter((stroke) => stroke?.points?.length >= 2)
                    .map((stroke, strokeIdx) => (
                      <ViroPolyline
                        key={strokeIdx}
                        position={[0, 0, 0.005]}
                        points={normalizedToAR(stroke.points)}
                        thickness={(stroke.thickness || 4) / 1000}
                        materials={[getMaterial(stroke.color)]}
                      />
                    ))}
                </ViroNode>
              )}
          </ViroARImageMarker>
        );
      })}
    </ViroARScene>
  );
};

export default OpeningScene;
