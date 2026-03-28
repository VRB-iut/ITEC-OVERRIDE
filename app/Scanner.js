import { ViroARSceneNavigator } from "@reactvision/react-viro";
// 1. Am adăugat useEffect aici sus
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DrawingCanvas from "../components/ar-scenes/DrawingCanvas";
import OpeningScene from "../components/ar-scenes/OpeningScene";
import COLOR from "../var/COLOR";
// 2. Trebuie să importăm IP-ul serverului vostru!
import IP from "../var/IP";

export default function Scanner() {
  const [showCanvas, setShowCanvas] = useState(false);
  const [currentPoster, setCurrentPoster] = useState(null);
  const [savedDrawings, setSavedDrawings] = useState({});

  // --- LOGICĂ NOUĂ MULTIPLAYER ---

  // Funcția care descarcă desenele tuturor de pe server
  const fetchDrawings = async () => {
    try {
      const response = await fetch(`http://${IP}:3000/drawings`);
      const data = await response.json();
      if (data.success && data.drawings) {
        setSavedDrawings(data.drawings);
      }
    } catch (error) {
      console.log("Eroare la descărcarea desenelor:", error);
    }
  };

  // Se execută automat când intri pe camera de scanare
  useEffect(() => {
    fetchDrawings();

    const interval = setInterval(fetchDrawings, 2500);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------

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
            // --- MODIFICARE AICI: Trimitem la server la apăsarea butonului ---
            onSave={async (normalizedStrokes) => {
              // 1. Afișăm instant pe telefonul tău ca să nu aștepți (Optimistic UI)
              setSavedDrawings((prev) => ({
                ...prev,
                [currentPoster]: normalizedStrokes,
              }));
              setShowCanvas(false);

              // 2. Trimitem desenul "pe ascuns" către server
              try {
                await fetch(`http://${IP}:3000/drawings`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    posterName: currentPoster,
                    strokes: normalizedStrokes,
                  }),
                });
                console.log("Desen salvat pe server cu succes!");
              } catch (error) {
                console.log("Eroare la salvarea pe server:", error);
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

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
