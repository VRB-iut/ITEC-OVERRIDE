import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  PanResponder,
  Dimensions,
  LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const POSTER_ASSETS: { [key: string]: any } = {
  "Poster 1": require("../../assets/afise/afis1.png"),
  "Poster 2": require("../../assets/afise/afis2.png"),
  "Poster 3": require("../../assets/afise/afis3.png"),
  "Poster 4": require("../../assets/afise/afis4.png"),
  "Poster 5": require("../../assets/afise/afis5.png"),
  "Poster 6": require("../../assets/afise/afis6.png"),
  "Poster 7": require("../../assets/afise/afis7.png"),
  "Poster 8": require("../../assets/afise/afis8.png"),
  "Poster 9": require("../../assets/afise/afis9.png"),
  "Poster 10": require("../../assets/afise/afis10.png"),
};

const COLORS = ["#FF0055", "#00FF00", "#00FFFF", "#FFFF00", "#FF6600", "#FFFFFF"];
const SIZES = [2, 4, 8, 12];

// ─── Tipuri ───────────────────────────────────────────────────────────────────

type RawPoint = { x: number; y: number };

export type Stroke = {
  color: string;
  thickness: number;
  points: RawPoint[];
};

export type NormalizedStroke = {
  color: string;
  thickness: number;
  points: { nx: number; ny: number }[];
};

// ─── Helpers SVG ──────────────────────────────────────────────────────────────

const buildSmoothPath = (pts: RawPoint[]): string => {
  if (!pts || pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
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

// ─── ImageRect ────────────────────────────────────────────────────────────────

type ImageRect = { x: number; y: number; width: number; height: number };

const computeImageRect = (canvasW: number, canvasH: number, natW: number, natH: number): ImageRect => {
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

// Denormalizează stroke-urile salvate înapoi la coordonate pixel
const denormalizeStrokes = (normalized: NormalizedStroke[], rect: ImageRect): Stroke[] =>
  normalized.map((s) => ({
    color: s.color,
    thickness: s.thickness,
    points: s.points.map((p) => ({
      x: p.nx * rect.width + rect.x,
      y: p.ny * rect.height + rect.y,
    })),
  }));

// ─── Componenta ───────────────────────────────────────────────────────────────

type Props = {
  posterName: string;
  initialStrokes?: NormalizedStroke[];
  onSave: (strokes: NormalizedStroke[]) => void;
  onCancel: () => void;
};

export default function DrawingCanvas({ posterName, initialStrokes, onSave, onCancel }: Props) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);
  const [canvasDim, setCanvasDim] = useState({ width: 1, height: 1 });
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedSize, setSelectedSize] = useState(SIZES[1]);

  const selectedColorRef = useRef(COLORS[0]);
  const selectedSizeRef = useRef(SIZES[1]);
  const activeStrokeRef = useRef<Stroke | null>(null);
  const imageRectRef = useRef<ImageRect | null>(null);
  const initializedRef = useRef(false); // încărcăm initialStrokes o singură dată

  useEffect(() => { selectedColorRef.current = selectedColor; }, [selectedColor]);
  useEffect(() => { selectedSizeRef.current = selectedSize; }, [selectedSize]);

  useEffect(() => {
    const asset = POSTER_ASSETS[posterName] ?? POSTER_ASSETS["Poster 1"];
    const source = Image.resolveAssetSource(asset);
    if (source?.width && source?.height) {
      setNaturalSize({ w: source.width, h: source.height });
    }
  }, [posterName]);

  useEffect(() => {
    if (naturalSize && canvasDim.width > 1) {
      const rect = computeImageRect(canvasDim.width, canvasDim.height, naturalSize.w, naturalSize.h);
      imageRectRef.current = rect;

      // Dacă există desene salvate anterior, le încărcăm o singură dată
      if (!initializedRef.current && initialStrokes && initialStrokes.length > 0) {
        initializedRef.current = true;
        setStrokes(denormalizeStrokes(initialStrokes, rect));
      }
    }
  }, [canvasDim, naturalSize]);

  const onCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setCanvasDim({ width, height });
  };

  // ─── PanResponder ─────────────────────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const newStroke: Stroke = {
          color: selectedColorRef.current,
          thickness: selectedSizeRef.current,
          points: [{ x: locationX, y: locationY }],
        };
        activeStrokeRef.current = newStroke;
        setActiveStroke({ ...newStroke });
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        if (!activeStrokeRef.current) return;
        const pts = activeStrokeRef.current.points;
        const last = pts[pts.length - 1];
        const dx = locationX - last.x;
        const dy = locationY - last.y;
        if (dx * dx + dy * dy < 4) return;
        activeStrokeRef.current.points = [...pts, { x: locationX, y: locationY }];
        setActiveStroke({ ...activeStrokeRef.current });
      },

      onPanResponderRelease: () => {
        if (!activeStrokeRef.current) return;
        const finished = activeStrokeRef.current;
        setStrokes((prev) => [...prev, finished]);
        activeStrokeRef.current = null;
        setActiveStroke(null);
      },
    })
  ).current;

  // ─── Save ─────────────────────────────────────────────────────────────────

  const totalPoints = strokes.reduce((acc, s) => acc + (s?.points?.length || 0), 0);

  const handleSave = () => {
    const rect = imageRectRef.current ?? { x: 0, y: 0, width: canvasDim.width || 1, height: canvasDim.height || 1 };
    const validStrokes = strokes.filter((s) => s?.points?.length > 0);
    const normalized: NormalizedStroke[] = validStrokes.map((stroke) => ({
      color: stroke.color,
      thickness: stroke.thickness,
      points: stroke.points.map((p) => ({
        nx: (p.x - rect.x) / rect.width,
        ny: (p.y - rect.y) / rect.height,
      })),
    }));
    onSave(normalized);
  };

  const handleUndo = () => setStrokes((prev) => prev.slice(0, -1));
  const handleClear = () => { setStrokes([]); setActiveStroke(null); };

  // ─── Render ───────────────────────────────────────────────────────────────

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

      <View style={styles.canvasContainer} onLayout={onCanvasLayout} {...panResponder.panHandlers}>
        <Image
          source={POSTER_ASSETS[posterName] ?? POSTER_ASSETS["Poster 1"]}
          style={[StyleSheet.absoluteFill, { width: undefined, height: undefined }]}
          resizeMode="contain"
          pointerEvents="none"
        />

        <Svg
          style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
          width={canvasDim.width}
          height={canvasDim.height}
          pointerEvents="none"
        >
          {strokes.map((stroke, i) => {
            if (!stroke?.points) return null;
            return (
              <Path
                key={i}
                d={buildSmoothPath(stroke.points)}
                stroke={stroke.color}
                strokeWidth={stroke.thickness}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            );
          })}
          {activeStroke && activeStroke.points?.length > 0 && (
            <Path
              d={buildSmoothPath(activeStroke.points)}
              stroke={activeStroke.color}
              strokeWidth={activeStroke.thickness}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
      </View>

      <View style={styles.footer}>
        <View style={styles.colorRow}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorBtn, { backgroundColor: color }, selectedColor === color && styles.colorBtnActive]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        <View style={styles.sizeRow}>
          {SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeBtnWrap, selectedSize === size && styles.sizeBtnActive]}
              onPress={() => setSelectedSize(size)}
            >
              <View style={[styles.sizeDot, { width: size + 6, height: size + 6, backgroundColor: selectedColor }]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, strokes.length === 0 && styles.actionBtnDisabled]}
            disabled={strokes.length === 0}
            onPress={handleUndo}
          >
            <Text style={styles.actionBtnText}>↩ Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, totalPoints < 5 && styles.saveBtnDisabled]}
            disabled={totalPoints < 5}
            onPress={handleSave}
          >
            <Text style={styles.saveBtnText}>APLICĂ PE AFIȘUL REAL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, strokes.length === 0 && styles.actionBtnDisabled]}
            disabled={strokes.length === 0}
            onPress={handleClear}
          >
            <Text style={styles.actionBtnText}>🗑 Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: "#111" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#222" },
  headerLabel: { color: "#FF0055", fontSize: 10, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1.5 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 2 },
  closeBtn: { backgroundColor: "#2a2a2a", width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  closeX: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  canvasContainer: { flex: 1, backgroundColor: "#000", marginHorizontal: 8, marginVertical: 6, borderRadius: 12, overflow: "hidden" },
  footer: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, alignItems: "center", gap: 12 },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  colorBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  colorBtnActive: { borderColor: "#fff", transform: [{ scale: 1.15 }] },
  sizeRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  sizeBtnWrap: { width: 40, height: 40, justifyContent: "center", alignItems: "center", borderRadius: 20, borderWidth: 1, borderColor: "#333" },
  sizeBtnActive: { borderColor: "#fff", backgroundColor: "rgba(255,255,255,0.08)" },
  sizeDot: { borderRadius: 100 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#2a2a2a" },
  actionBtnDisabled: { opacity: 0.35 },
  actionBtnText: { color: "#ccc", fontSize: 12, fontWeight: "600" },
  saveBtn: { flex: 1, backgroundColor: "#FF0055", paddingVertical: 14, borderRadius: 30, alignItems: "center" },
  saveBtnDisabled: { backgroundColor: "#4a0020" },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 13 },
});
