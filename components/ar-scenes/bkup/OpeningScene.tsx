import React from "react";
import {
  ViroARScene,
  ViroARImageMarker,
  ViroNode,
  ViroPolyline,
  ViroARTrackingTargets,
  ViroMaterials
} from "@reactvision/react-viro";

// Materiale
ViroMaterials.createMaterials({
  redLine: { diffuseColor: "#FF0055" },
  greenLine: { diffuseColor: "#00FF00" },
  cyanLine: { diffuseColor: "#00FFFF" },
  yellowLine: { diffuseColor: "#FFFF00" },
  orangeLine: { diffuseColor: "#FF6600" },
  whiteLine: { diffuseColor: "#FFFFFF" },
});

const getColorMaterial = (hexColor: string) => {
  const colorMap: { [key: string]: string } = {
    "#FF0055": "redLine", "#00FF00": "greenLine", "#00FFFF": "cyanLine",
    "#FFFF00": "yellowLine", "#FF6600": "orangeLine", "#FFFFFF": "whiteLine",
  };
  return colorMap[hexColor] || "redLine";
};

const MARKER_WIDTH = 0.2; // 20cm

// ÎNREGISTRĂM TOATE CELE 10 AFIȘE
ViroARTrackingTargets.createTargets({
  "poster1": { source: require("../../assets/afise/afis1.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
  "poster2": { source: require("../../assets/afise/afis2.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
  "poster3": { source: require("../../assets/afise/afis3.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
  "poster4": { source: require("../../assets/afise/afis4.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
  "poster5": { source: require("../../assets/afise/afis5.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
  "poster6": { source: require("../../assets/afise/afis6.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
  "poster7": { source: require("../../assets/afise/afis7.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
  "poster8": { source: require("../../assets/afise/afis8.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
  "poster9": { source: require("../../assets/afise/afis9.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
  "poster10": { source: require("../../assets/afise/afis10.png"), orientation: "Up", physicalWidth: MARKER_WIDTH },
});

const OpeningScene = (props: any) => {
  const { drawings, onPosterFound } = props.arSceneNavigator?.viroAppProps || {};

  // Helpers Matematice Blindate
  const groupPointsByStyle = (normalizedPoints: any[]) => {
    if (!normalizedPoints || normalizedPoints.length < 2) return [];
    const groups: any[] = [];
    let currentGroup: any[] = [];
    let currentColor = normalizedPoints[0]?.color || "#FF0055";
    let currentThickness = normalizedPoints[0]?.thickness || 4;

    normalizedPoints.forEach((p: any) => {
      const pColor = p.color || "#FF0055";
      const pThickness = p.thickness || 4;
      if (pColor === currentColor && pThickness === currentThickness) {
        currentGroup.push(p);
      } else {
        if (currentGroup.length > 1) {
          groups.push({ color: currentColor, thickness: currentThickness, points: currentGroup });
        }
        currentGroup = [p];
        currentColor = pColor;
        currentThickness = pThickness;
      }
    });
    if (currentGroup.length > 1) {
      groups.push({ color: currentColor, thickness: currentThickness, points: currentGroup });
    }
    return groups;
  };

  const pointsToAR = (points: any[]) => {
    return points.map((p: any) => {
      const arX = (p.nx - 0.5) * MARKER_WIDTH;
      const arY = (0.5 - p.ny) * MARKER_WIDTH;
      return [arX, arY, 0];
    });
  };

  // Configurația pentru randare automată (pentru a evita copy-paste de 10 ori)
  const posterConfigs = [
    { target: "poster1", name: "Poster 1" }, { target: "poster2", name: "Poster 2" },
    { target: "poster3", name: "Poster 3" }, { target: "poster4", name: "Poster 4" },
    { target: "poster5", name: "Poster 5" }, { target: "poster6", name: "Poster 6" },
    { target: "poster7", name: "Poster 7" }, { target: "poster8", name: "Poster 8" },
    { target: "poster9", name: "Poster 9" }, { target: "poster10", name: "Poster 10" },
  ];

  return (
    <ViroARScene>
      {posterConfigs.map((config) => (
        <ViroARImageMarker 
          key={config.target}
          target={config.target} 
          onAnchorFound={() => onPosterFound && onPosterFound(config.name)}
        >
          {drawings && drawings[config.name] && (
            <ViroNode rotation={[-90, 0, 0]}>
              {groupPointsByStyle(drawings[config.name]).map((group: any, idx: number) => (
                <ViroPolyline
                  key={idx}
                  position={[0, 0, 0.005]}
                  points={pointsToAR(group.points)}
                  // Normalizăm grosimea: 2px devine 2mm în AR, 12px devine 1.2cm
                  thickness={(group.thickness || 4) / 1000}
                  materials={[getColorMaterial(group.color)]}
                />
              ))}
            </ViroNode>
          )}
        </ViroARImageMarker>
      ))}
    </ViroARScene>
  );
};

export default OpeningScene;