import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- REPARARE NUME POSTERE (Să bată cu ce caută Viro în log-uri) ---
const POSTER_ASSETS: { [key: string]: any } = {
  "Poster 1": require("../../assets/afise/afis1.png"),
  "Poster 2": require("../../assets/afise/afis2.png"),
  "Poster 3": require("../../assets/afise/afis3.png"),
  "Poster 4": require("../../assets/afise/afis4.png"), // Fix pentru eroarea din log-uri
  "Poster 5": require("../../assets/afise/afis5.png"),
  "Poster 6": require("../../assets/afise/afis6.png"),
  "Poster 7": require("../../assets/afise/afis7.png"),
  "Poster 8": require("../../assets/afise/afis8.png"),
  "Poster 9": require("../../assets/afise/afis9.png"),
  "Poster 10": require("../../assets/afise/afis10.png"),
};

// --- Tipuri ---
type RawPoint = { x: number; y: number };
export type Stroke = { color: string; thickness: number; points: RawPoint[] };
export type NormalizedStroke = {
  color: string;
  thickness: number;
  points: { nx: number; ny: number }[];
};

const buildSmoothPath = (pts: RawPoint[]): string => {
  if (!pts || pts.length === 0) return "";
  if (pts.length === 1)
    return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i];
    const next = pts[i + 1];
    const mx = (curr.x + next.x) / 2;
    const my = (curr.y + next.y) / 2;
    d += ` Q ${curr.x} ${curr.y} ${mx} ${my}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
};

type ImageRect = { x: number; y: number; width: number; height: number };

const computeImageRect = (
  canvasW: number,
  canvasH: number,
  natW: number,
  natH: number,
): ImageRect => {
  const imageRatio = natW / natH;
  const canvasRatio = canvasW / canvasH;
  let renderW: number, renderH: number;
  if (imageRatio > canvasRatio) {
    renderW = canvasW;
    renderH = canvasW / imageRatio;
  } else {
    renderH = canvasH;
    renderW = canvasH * imageRatio;
  }
  return {
    x: (canvasW - renderW) / 2,
    y: (canvasH - renderH) / 2,
    width: renderW || 1,
    height: renderH || 1,
  };
};

const denormalizeStrokes = (
  normalized: NormalizedStroke[],
  rect: ImageRect,
): Stroke[] =>
  normalized.map((s) => ({
    color: s.color,
    thickness: s.thickness,
    points: s.points.map((p) => ({
      x: p.nx * rect.width + rect.x,
      y: p.ny * rect.height + rect.y,
    })),
  }));

type Props = {
  posterName: string;
  initialStrokes?: NormalizedStroke[];
  onSave: (strokes: NormalizedStroke[]) => void;
  onCancel: () => void;
};

export default function DrawingCanvas({
  posterName,
  initialStrokes,
  onSave,
  onCancel,
}: Props) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const [canvasDim, setCanvasDim] = useState({ width: 1, height: 1 });
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedSize, setSelectedSize] = useState(SIZES[1]);

  const selectedColorRef = useRef(COLORS[0]);
  const selectedSizeRef = useRef(SIZES[1]);
  const imageRectRef = useRef<ImageRect | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    selectedColorRef.current = selectedColor;
  }, [selectedColor]);
  useEffect(() => {
    selectedSizeRef.current = selectedSize;
  }, [selectedSize]);

  useEffect(() => {
    const asset = POSTER_ASSETS[posterName] ?? POSTER_ASSETS["Poster 1"];
    const source = Image.resolveAssetSource(asset);
    if (source?.width && source?.height)
      setNaturalSize({ w: source.width, h: source.height });
  }, [posterName]);

  useEffect(() => {
    if (naturalSize && canvasDim.width > 1) {
      const rect = computeImageRect(
        canvasDim.width,
        canvasDim.height,
        naturalSize.w,
        naturalSize.h,
      );
      imageRectRef.current = rect;
      if (
        !initializedRef.current &&
        initialStrokes &&
        initialStrokes.length > 0
      ) {
        initializedRef.current = true;
        setStrokes(denormalizeStrokes(initialStrokes, rect));
      }
    }
  }, [canvasDim, naturalSize]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const newStroke = {
          color: selectedColorRef.current,
          thickness: selectedSizeRef.current,
          points: [{ x: locationX, y: locationY }],
        };
        setActiveStroke(newStroke);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setActiveStroke((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            points: [...prev.points, { x: locationX, y: locationY }],
          };
        });
      },
      onPanResponderRelease: (evt, gestureState) => {
        setActiveStroke((current) => {
          if (current) setStrokes((prev) => [...prev, current]);
          return null;
        });
      },
    }),
  ).current;

  const handleSave = () => {
    const rect = imageRectRef.current ?? {
      x: 0,
      y: 0,
      width: canvasDim.width || 1,
      height: canvasDim.height || 1,
    };
    const normalized: NormalizedStroke[] = strokes.map((stroke) => ({
      color: stroke.color,
      thickness: stroke.thickness,
      points: stroke.points.map((p) => ({
        nx: (p.x - rect.x) / rect.width,
        ny: (p.y - rect.y) / rect.height,
      })),
    }));
    onSave(normalized);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Mod Vandalism</Text>
          <Text style={styles.headerTitle}>{posterName}</Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
          <Text style={styles.closeX}>✕</Text>
        </TouchableOpacity>
      </View>

      <View
        style={styles.canvasContainer}
        onLayout={(e) => setCanvasDim(e.nativeEvent.layout)}
        {...panResponder.panHandlers}
      >
        <Image
          source={POSTER_ASSETS[posterName] ?? POSTER_ASSETS["Poster 1"]}
          style={styles.bgImage}
          resizeMode="contain"
        />
        <Svg
          style={StyleSheet.absoluteFill}
          width={canvasDim.width}
          height={canvasDim.height}
          pointerEvents="none"
        >
          {strokes.map((s, i) => (
            <Path
              key={i}
              d={buildSmoothPath(s.points)}
              stroke={s.color}
              strokeWidth={s.thickness}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {activeStroke && (
            <Path
              d={buildSmoothPath(activeStroke.points)}
              stroke={activeStroke.color}
              strokeWidth={activeStroke.thickness}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>

      <View style={styles.footer}>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorBtn,
                { backgroundColor: c },
                selectedColor === c && styles.colorBtnActive,
              ]}
              onPress={() => setSelectedColor(c)}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setStrokes((s) => s.slice(0, -1))}
          >
            <Text style={styles.actionBtnText}>↩ Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>APLICĂ PE AFIȘUL REAL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setStrokes([])}
          >
            <Text style={styles.actionBtnText}>🗑 Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const COLORS = [
  "#FF0055",
  "#00FF00",
  "#00FFFF",
  "#FFFF00",
  "#FF6600",
  "#FFFFFF",
];
const SIZES = [2, 4, 8, 12];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  headerLabel: { color: "#FF0055", fontSize: 10, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  closeBtn: {
    backgroundColor: "#2a2a2a",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeX: { color: "#fff", fontSize: 14 },
  canvasContainer: {
    flex: 1,
    backgroundColor: "#000",
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  footer: { padding: 20, alignItems: "center", gap: 12 },
  colorRow: { flexDirection: "row", gap: 10 },
  colorBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorBtnActive: { borderColor: "#fff" },
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: { padding: 12, borderRadius: 20, backgroundColor: "#2a2a2a" },
  actionBtnText: { color: "#ccc", fontSize: 12 },
  saveBtn: {
    flex: 1,
    backgroundColor: "#FF0055",
    padding: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "bold" },
});
