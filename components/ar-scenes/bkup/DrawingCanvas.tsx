import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image, PanResponder, Dimensions, LayoutChangeEvent } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mapăm PNG-urile tale din assets (Să fie 10!)
const POSTER_ASSETS: { [key: string]: any } = {
  "Poster 1": require("../../assets/afise/afis1.png"),
  "Poster 2": require("../../assets/afise/afis2.png"),
  "Poster 3": require("../../assets/afise/afis3.png"),
  "Poster 4": require("../../assets/afise/afis4.png"),
  "Poster 5": require("../../assets/afise/afis5.png"), // Adăugate
  "Poster 6": require("../../assets/afise/afis6.png"),
  "Poster 7": require("../../assets/afise/afis7.png"),
  "Poster 8": require("../../assets/afise/afis8.png"),
  "Poster 9": require("../../assets/afise/afis9.png"),
  "Poster 10": require("../../assets/afise/afis10.png"),
};

const COLORS = ["#FF0055", "#00FF00", "#00FFFF", "#FFFF00", "#FF6600", "#FFFFFF"];
const SIZES = [2, 4, 8, 12]; 

export default function DrawingCanvas({ posterName, onSave, onCancel }: any) {
  const [points, setPoints] = useState<{x: number, y: number, color: string, thickness: number}[]>([]);
  const [canvasDim, setCanvasDim] = useState({ width: 1, height: 1 });
  
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedSize, setSelectedSize] = useState(SIZES[1]); 
  
  const selectedColorRef = useRef(COLORS[0]);
  const selectedSizeRef = useRef(SIZES[1]);
  // Reținem ultimul punct pentru interpolare
  const lastPointRef = useRef<{x: number, y: number} | null>(null);

  const onCanvasLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if(width > 0 && height > 0) setCanvasDim({ width, height });
  };

  useEffect(() => {
    selectedColorRef.current = selectedColor;
    selectedSizeRef.current = selectedSize;
  }, [selectedColor, selectedSize]);

  // Funcție helper pentru interpolare (Adaugă puncte intermediare)
  const interpolatePoints = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    const newPoints = [];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Dacă distanța e mică, nu interpolăm
    if (distance < 5) return [p2];

    // Adăugăm un punct la fiecare 3 pixeli
    const steps = Math.max(1, Math.floor(distance / 3)); 
    
    for (let i = 1; i <= steps; i++) {
      newPoints.push({
        x: p1.x + (dx * (i / steps)),
        y: p1.y + (dy * (i / steps)),
        color: selectedColorRef.current,
        thickness: selectedSizeRef.current
      });
    }
    return newPoints;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        // Resetăm ultimul punct când începem o linie nouă
        const { locationX, locationY } = evt.nativeEvent;
        const startPoint = { x: locationX, y: locationY, color: selectedColorRef.current, thickness: selectedSizeRef.current };
        setPoints((prev) => [...prev, startPoint]);
        lastPointRef.current = { x: locationX, y: locationY };
      },

      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const currentPoint = { x: locationX, y: locationY };
        
        if (lastPointRef.current) {
          // Generăm puncte intermediare pentru un desen "smooth"
          const smoothPoints = interpolatePoints(lastPointRef.current, currentPoint);
          setPoints((prev) => [...prev, ...smoothPoints]);
        }
        
        lastPointRef.current = currentPoint;
      },
      
      onPanResponderRelease: () => {
        // Resetăm la finalul liniei
        lastPointRef.current = null;
      }
    })
  ).current;

  const handleSave = () => {
    // Normalizăm punctele, asigurându-ne că width/height nu sunt 0
    const safeWidth = canvasDim.width || 1;
    const safeHeight = canvasDim.height || 1;

    const normalizedPoints = points.map(p => ({
      nx: p.x / safeWidth,
      ny: p.y / safeHeight,
      color: p.color,
      thickness: p.thickness || 4 
    }));
    onSave(normalizedPoints);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerText}>Mod Vandalism</Text>
          <Text style={styles.subHeaderText}>{posterName}</Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
          <Text style={styles.closeX}>X</Text>
        </TouchableOpacity>
      </View>

      {/* ZONA DE DESEN */}
      <View style={styles.canvasContainer}>
        <Image 
          source={POSTER_ASSETS[posterName] || POSTER_ASSETS["Poster 1"]} 
          style={{width: '100%', height: '100%', position: 'absolute'}}
          resizeMode="contain" 
        />

        <View style={styles.touchLayer} {...panResponder.panHandlers} onLayout={onCanvasLayout}>
          {points.length > 1 && points.map((p, i) => {
            if (i === 0) return null;
            const prevPoint = points[i - 1];
            
            const safeThickness = prevPoint.thickness || 4;
            
            // Nu legăm dacă sunt din linii diferite (verificăm distanța)
            const dx = p.x - prevPoint.x;
            const dy = p.y - prevPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 20) return null; // Prag mai mic pt interpolare
            
            const centerX = (prevPoint.x + p.x) / 2;
            const centerY = (prevPoint.y + p.y) / 2;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            return (
              <View
                key={i}
                style={[
                  styles.line,
                  {
                    left: centerX - distance / 2,
                    top: centerY - (safeThickness / 2),
                    width: distance + 0.5, // Puțină suprapunere anti-goluri
                    height: safeThickness, 
                    transform: [{ rotate: `${angle}deg` }],
                    backgroundColor: prevPoint.color,
                  }
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        {/* Color Picker */}
        <View style={styles.colorPicker}>
          {COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[styles.colorButton, { backgroundColor: color }, selectedColor === color && styles.colorButtonSelected]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>
        
        {/* Size Picker */}
        <View style={styles.sizePicker}>
          {SIZES.map(size => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeButtonContainer, selectedSize === size && styles.sizeButtonSelected]}
              onPress={() => setSelectedSize(size)}
            >
              <View style={[styles.sizeDot, { width: size + 4, height: size + 4, backgroundColor: selectedColor }]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
            style={[styles.saveBtn, points.length < 10 && { backgroundColor: "#555" }]} 
            disabled={points.length < 10} // Mai multe puncte necesare
            onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>APLICĂ PE AFISUL REAL</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{marginTop: 10}} onPress={() => setPoints([])}>
          <Text style={{color: '#aaa', fontSize: 12}}>Șterge tot</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: "rgba(18, 18, 18, 0.98)" },
  header: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 25, paddingVertical: 15, alignItems: "center" },
  headerText: { color: "#FF0055", fontSize: 10, fontWeight: "bold", textTransform: 'uppercase' },
  subHeaderText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  closeBtn: { backgroundColor: '#333', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  closeX: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  canvasContainer: { flex: 1, overflow: "hidden", backgroundColor: "#000", marginHorizontal: 8, borderRadius: 12 },
  touchLayer: { flex: 1, backgroundColor: "transparent" },
  line: { position: "absolute", borderRadius: 100 }, // Linii rotunjite
  footer: { paddingHorizontal: 20, paddingVertical: 20, alignItems: "center" },
  colorPicker: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  colorButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  colorButtonSelected: { borderColor: '#fff', elevation: 5 },
  sizePicker: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 20 },
  sizeButtonContainer: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: '#333' },
  sizeButtonSelected: { borderColor: '#fff', backgroundColor: 'rgba(255,255,255,0.1)' },
  sizeDot: { borderRadius: 100 },
  saveBtn: { backgroundColor: "#FF0055", paddingVertical: 16, paddingHorizontal: 40, borderRadius: 30 },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
});