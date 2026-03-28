import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import COLOR from "../var/COLOR";
import IP from "../var/IP";

const COLOR_OPTIONS = [
  { id: "1", hex: "#32CD32", name: "Lime" },
  { id: "2", hex: "#AF52DE", name: "Purple" },
  { id: "3", hex: "#007AFF", name: "Blue" },
  { id: "4", hex: "#FF9500", name: "Orange" },
  { id: "5", hex: "#FF3B30", name: "Red" },
  { id: "6", hex: "#b030ff", name: "Purple Dark" },
  { id: "7", hex: "#4cff30", name: "Neon" },
  { id: "8", hex: "#ff30a9", name: "Pink" },
];

export default function CreateTeam() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].hex);

  const handleCreateTeam = async () => {
    const normalizedTeamName = teamName.trim();
    const normalizedPassword = password.trim();

    if (!normalizedTeamName || !normalizedPassword) {
      Alert.alert("Eroare", "Te rugăm să completezi toate câmpurile.");
      return;
    }

    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (!storedUserId) {
        router.replace("/LogInScreen");
        return;
      }

      const response = await fetch(`http://${IP}:3000/create-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: normalizedTeamName,
          userId: parseInt(storedUserId, 10),
          password: normalizedPassword,
          colorHex: selectedColor,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.replace("/Home");
      } else {
        Alert.alert("Eroare", data.message || "Ceva nu a mers bine.");
      }
    } catch (error) {
      Alert.alert("Eroare", "Nu s-a putut conecta la server.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: COLOR.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>CONFIG</Text>
          <Text
            style={[
              styles.headerTitle,
              { color: selectedColor },
              { fontSize: teamName.length === 0 ? 27 : 36 },
            ]}
          >
            {/* Sincronizare: Dacă scrie, apare numele limitat visual pe buton, altfel "CREEAZĂ" */}

            {teamName.trim() !== ""
              ? teamName.length > 15
                ? teamName.substring(0, 12) + "..."
                : teamName.toUpperCase()
              : "CREATE YOUR TEAM"}
          </Text>
        </View>

        <View style={styles.userInputContainer}>
          <Text style={styles.text}>TEAM NAME:</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Team name..."
            placeholderTextColor="#444"
            value={teamName}
            onChangeText={(text) => {
              // Limităm inputul la 20 caractere total pentru baza de date
              if (text.length <= 20) setTeamName(text);
            }}
            autoCapitalize="none"
          />

          <Text style={styles.text}>PASSWORD:</Text>
          <TextInput
            style={styles.inputField}
            placeholder="Parola privată..."
            placeholderTextColor="#444"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.text}>SELECT COLOR:</Text>
          <View style={styles.colorPickerContainer}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color.id}
                onPress={() => setSelectedColor(color.hex)}
                style={[
                  styles.colorSquare,
                  { backgroundColor: color.hex },
                  selectedColor === color.hex && styles.selectedSquare,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.buttonButton, { backgroundColor: selectedColor }]}
            onPress={handleCreateTeam}
          >
            <Text style={styles.ButtonText} numberOfLines={1}>
              CREATE TEAM
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace("/Profile")}
            style={styles.backButton}
          >
            <Text style={styles.backText}>BACK</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingBottom: 40,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    alignItems: "center",
  },
  headerLabel: {
    color: "#444",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 3,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },
  userInputContainer: {
    width: "90%",
    gap: 12,
    alignItems: "center",
    backgroundColor: COLOR.borderColor,
    padding: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  text: {
    color: "#666",
    fontSize: 9,
    fontWeight: "bold",
    alignSelf: "flex-start",
    letterSpacing: 1.5,
    marginTop: 5,
  },
  inputField: {
    width: "100%",
    height: 55,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    color: "white",
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  colorPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    width: "100%",
    marginTop: 5,
  },
  colorSquare: {
    width: 42,
    height: 42,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.2)",
  },
  selectedSquare: {
    zIndex: 1,
    borderColor: "white",
    transform: [{ scale: 1.4 }],
  },
  buttonContainer: {
    marginTop: 30,
    width: "90%",
    alignItems: "center",
  },
  buttonButton: {
    width: "100%",
    height: 65,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  ButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
  backButton: {
    marginTop: 25,
    padding: 10,
  },
  backText: {
    color: "#444",
    fontWeight: "bold",
    fontSize: 11,
    letterSpacing: 2,
  },
});
