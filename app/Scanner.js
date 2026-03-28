import { ViroARSceneNavigator } from "@reactvision/react-viro";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DrawingCanvas from "../components/ar-scenes/DrawingCanvas";
import OpeningScene from "../components/ar-scenes/OpeningScene";
import COLOR from "../var/COLOR";

export default function Scanner() {
  const [showCanvas, setShowCanvas] = useState(false);
  const [currentPoster, setCurrentPoster] = useState(null);
  const [savedDrawings, setSavedDrawings] = useState({});

  const handlePosterFound = useCallback(
    (name) => {
      if (!showCanvas) setCurrentPoster(name);
    },
    [showCanvas],
  );

  const handlePosterLost = useCallback(
    (name) => {
      if (!showCanvas) {
        setCurrentPoster((prev) => (prev === name ? null : prev));
      }
    },
    [showCanvas],
  );

  const handleOpenCanvas = () => {
    if (currentPoster) setShowCanvas(true);
  };

  const posterDetected = currentPoster !== null;

  const viroProps = useMemo(
    () => ({
      drawings: savedDrawings,
      onPosterFound: handlePosterFound,
      onPosterLost: handlePosterLost,
    }),
    [savedDrawings, handlePosterFound, handlePosterLost],
  );

  return (
    <View style={styles.container}>
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{ scene: OpeningScene }}
        viroAppProps={viroProps}
        style={StyleSheet.absoluteFill}
      />

      {!showCanvas && (
        <View style={styles.overlay} pointerEvents="box-none">
          <View
            style={[
              styles.detectionBadge,
              posterDetected && styles.badgeActive,
            ]}
          >
            {posterDetected ? (
              <Text style={styles.detectionText}>
                ● {currentPoster} Detectat
              </Text>
            ) : (
              <Text style={styles.detectionTextInactive}>
                Caută un poster...
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.captureBtn,
              posterDetected && styles.captureBtnActive,
            ]}
            onPress={handleOpenCanvas}
            disabled={!posterDetected}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.captureInner,
                posterDetected && styles.captureInnerActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      )}

      {showCanvas && currentPoster && (
        <View style={StyleSheet.absoluteFill}>
          <DrawingCanvas
            posterName={currentPoster}
            initialStrokes={savedDrawings[currentPoster]}
            onCancel={() => setShowCanvas(false)}
            onSave={(normalizedStrokes) => {
              setSavedDrawings((prev) => ({
                ...prev,
                [currentPoster]: normalizedStrokes,
              }));
              setShowCanvas(false);
            }}
          />
        </View>
      )}
    </View>
  );
}

// Stilurile rămân neschimbate (le ai deja corecte)
const CAPTURE_SIZE = 76;
const INNER_SIZE = 58;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLOR.background },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 60,
  },
  detectionBadge: {
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  badgeActive: {
    borderColor: COLOR.primary,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  detectionText: {
    color: COLOR.primary,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  detectionTextInactive: { color: "#888", fontSize: 13, fontWeight: "bold" },
  captureBtn: {
    width: CAPTURE_SIZE,
    height: CAPTURE_SIZE,
    borderRadius: CAPTURE_SIZE / 2,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  captureBtnActive: { borderColor: COLOR.primary },
  captureInner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  captureInnerActive: { backgroundColor: COLOR.primary },
});
