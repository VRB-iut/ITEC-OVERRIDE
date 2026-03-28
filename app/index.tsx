import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { ViroARSceneNavigator } from '@reactvision/react-viro';
import OpeningScene from '../components/ar-scenes/OpeningScene';
import DrawingCanvas, { NormalizedStroke } from '../components/ar-scenes/DrawingCanvas';

export default function Index() {
  const [showCanvas, setShowCanvas] = useState(false);
  const [currentPoster, setCurrentPoster] = useState<string | null>(null);
  const [savedDrawings, setSavedDrawings] = useState<{ [key: string]: NormalizedStroke[] }>({});

  const handlePosterFound = (name: string) => {
    if (!showCanvas) {
      setCurrentPoster(name);
    }
  };

  const handlePosterLost = (name: string) => {
    // Ștergem detecția doar dacă e același poster și canvas-ul e închis
    if (!showCanvas) {
      setCurrentPoster((prev) => (prev === name ? null : prev));
    }
  };

  const handleOpenCanvas = () => {
    if (currentPoster) setShowCanvas(true);
  };

  const posterDetected = currentPoster !== null;

  return (
    <View style={styles.container}>
      {/* Camera AR */}
      <ViroARSceneNavigator
        autofocus={true}
        initialScene={{ scene: OpeningScene }}
        viroAppProps={{
          drawings: savedDrawings,
          onPosterFound: handlePosterFound,
          onPosterLost: handlePosterLost,
        }}
        style={StyleSheet.absoluteFill}
      />

      {/* UI overlay — buton captură + label poster detectat */}
      {!showCanvas && (
        <View style={styles.overlay} pointerEvents="box-none">
          {/* Label poster detectat */}
          <View style={styles.detectionBadge} pointerEvents="none">
            {posterDetected ? (
              <Text style={styles.detectionText}>● {currentPoster} detectat</Text>
            ) : (
              <Text style={styles.detectionTextInactive}>Îndreaptă camera spre un afiș</Text>
            )}
          </View>

          {/* Buton captură (stil cameră) */}
          <View style={styles.captureRow}>
            <TouchableOpacity
              style={[styles.captureBtn, posterDetected && styles.captureBtnActive]}
              onPress={handleOpenCanvas}
              disabled={!posterDetected}
              activeOpacity={0.7}
            >
              <View style={[styles.captureInner, posterDetected && styles.captureInnerActive]} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Canvas desenat */}
      {showCanvas && currentPoster && (
        <View style={StyleSheet.absoluteFill}>
          <DrawingCanvas
            posterName={currentPoster}
            initialStrokes={savedDrawings[currentPoster]}
            onCancel={() => setShowCanvas(false)}
            onSave={(normalizedStrokes: NormalizedStroke[]) => {
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

const CAPTURE_SIZE = 72;
const INNER_SIZE = 54;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
  },

  // Label
  detectionBadge: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  detectionText: {
    color: '#FF0055',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  detectionTextInactive: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
  },

  // Buton captură
  captureRow: {
    alignItems: 'center',
  },
  captureBtn: {
    width: CAPTURE_SIZE,
    height: CAPTURE_SIZE,
    borderRadius: CAPTURE_SIZE / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnActive: {
    borderColor: '#FF0055',
  },
  captureInner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  captureInnerActive: {
    backgroundColor: '#FF0055',
  },
});
