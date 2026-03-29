import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera"; // Import nou
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import COLOR from "../var/COLOR";
import IP from "../var/IP";

export default function ProfileContainer() {
  const [data, setData] = useState(null);
  const [showQRMenu, setShowQRMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false); // State pentru a opri scanarea repetată
  const [permission, requestPermission] = useCameraPermissions();
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        setLoading(false);
        return;
      }
      const response = await fetch(`http://${IP}:3000/user/${userId}`);
      const result = await response.json();
      if (result.success) {
        const wins = result.user.battlesWon || 0;
        const losses = result.user.battlesLost || 0;
        const ratio =
          losses === 0 ? wins.toFixed(2) : (wins / losses).toFixed(2);

        setData({
          wins,
          losses,
          username: result.user.username,
          WLratio: ratio,
          teamName: result.user.teamName,
          teamPassword: result.user.teamPassword,
          teamInviteCode: result.user.teamInviteCode,
          teamColor: result.user.teamColor || COLOR.primary,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Eroare la fetch profil:", error);
      setLoading(false);
    }
  };

  const handleBarCodeScanned = async ({ data: qrRawData }) => {
    if (scanning) return;
    setScanning(true);

    try {
      const userId = await AsyncStorage.getItem("userId");
      let response;

      // Format nou: OVRTEAM:<inviteCode>
      if (typeof qrRawData === "string" && qrRawData.startsWith("OVRTEAM:")) {
        const inviteCode = qrRawData.slice("OVRTEAM:".length).trim();

        if (!inviteCode) {
          throw new Error("Invite code lipsa");
        }

        response = await fetch(`http://${IP}:3000/join-team-invite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode, userId }),
        });
      } else {
        // Fallback pentru QR-urile vechi: teamName:password
        const [teamName, password] = String(qrRawData).split(":");

        if (!teamName || !password) {
          throw new Error("Format QR invalid");
        }

        response = await fetch(`http://${IP}:3000/join-team`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamName, password, userId }),
        });
      }

      const result = await response.json();

      if (result.success) {
        Alert.alert("Succes", `Te-ai alăturat echipei ${result.teamName}!`);
        setShowQRMenu(false);
        fetchUserData(); // Refresh date profil
      } else {
        Alert.alert("Eroare", result.message || "Nu s-a putut face join.");
      }
    } catch (error) {
      Alert.alert("Eroare Scanare", "Codul QR nu este valid pentru echipe.");
    } finally {
      // Asteptam putin inainte de a permite o alta scanare
      setTimeout(() => setScanning(false), 2000);
    }
  };

  const toggleCamera = async () => {
    if (!data?.teamName && !permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permisiune refuzată", "Avem nevoie de acces la cameră.");
        return;
      }
    }
    setShowQRMenu(!showQRMenu);
  };

  return (
    <View style={styles.cardContainer}>
      {loading ? (
        <ActivityIndicator size="large" color={COLOR.primary} />
      ) : (
        <>
          <View style={styles.headerSection}>
            <View style={styles.textGroup}>
              <Text style={styles.label}>PROFIL UTILIZATOR</Text>
              <Text style={styles.usernameText} numberOfLines={1}>
                {data?.username || "Încărcare..."}
              </Text>
            </View>

            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={toggleCamera}
                style={[
                  styles.iconButton,
                  showQRMenu && { borderColor: COLOR.primary },
                ]}
              >
                <Ionicons
                  name={showQRMenu ? "close-outline" : "qr-code-outline"}
                  size={20}
                  color={showQRMenu ? COLOR.primary : "#fff"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/LogInScreen")}
                style={styles.iconButton}
              >
                <Ionicons name="log-out-outline" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>

          {showQRMenu && (
            <View style={styles.qrMenuContainer}>
              {data?.teamName ? (
                <View style={styles.qrDisplay}>
                  <Text style={styles.qrTitle}>COD INVITATIE ECHIPA</Text>
                  <View style={styles.qrWrapper}>
                    <QRCode
                      value={
                        data.teamInviteCode
                          ? `OVRTEAM:${data.teamInviteCode}`
                          : `${data.teamName}:${data.teamPassword}`
                      }
                      size={140}
                      color="black"
                      backgroundColor="white"
                    />
                  </View>
                  <Text style={styles.qrTeamName}>{data.teamName}</Text>
                  <Text style={styles.qrMenuText}>Scaneaza pentru join la echipa</Text>
                </View>
              ) : (
                <View style={styles.cameraWrapper}>
                  <CameraView
                    style={styles.camera}
                    onBarcodeScanned={
                      scanning ? undefined : handleBarCodeScanned
                    }
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  />
                </View>
              )}
            </View>
          )}

          {/* SECȚIUNE ECHIPĂ */}
          <View style={styles.teamSection}>
            {data?.teamName ? (
              <View
                style={[styles.teamBadge, { borderLeftColor: data.teamColor }]}
              >
                <Text style={styles.teamLabel}>ECHIPĂ ACTIVĂ</Text>
                <Text style={styles.teamNameText}>{data.teamName}</Text>
              </View>
            ) : (
              <View style={styles.noTeamRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => router.push("/JoinTeam")}
                >
                  <Text style={styles.actionButtonText}>JOIN TEAM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.createOutline]}
                  onPress={() => router.push("/CreateTeam")}
                >
                  <Text
                    style={[styles.actionButtonText, { color: COLOR.primary }]}
                  >
                    CREATE TEAM
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* STATISTICI (Wins/Losses) */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>WINS</Text>
              <Text style={[styles.statValue, { color: "#4CAF50" }]}>
                {data?.wins ?? 0}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>LOSSES</Text>
              <Text style={[styles.statValue, { color: "#F44336" }]}>
                {data?.losses ?? 0}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>W/L</Text>
              <Text style={styles.statValue}>{data?.WLratio ?? "0.00"}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

// STILURI ADĂUGATE/MODIFICATE
const styles = StyleSheet.create({
  // ... stilurile tale existente rămân la fel ...
  cardContainer: {
    position: "absolute",
    top: 50,
    backgroundColor: COLOR.borderColor,
    width: "92%",
    alignSelf: "center",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  textGroup: { flex: 1 },
  label: { color: "#666", fontSize: 9, fontWeight: "bold", letterSpacing: 1 },
  usernameText: { color: "#fff", fontSize: 26, fontWeight: "900" },
  headerButtons: { flexDirection: "row", gap: 10 },
  iconButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  qrMenuContainer: {
    height: 200, // Înălțime fixă pentru zona camerei
    backgroundColor: "#000",
    borderRadius: 20,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLOR.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  qrDisplay: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qrTitle: {
    color: COLOR.primary,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  qrWrapper: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 10,
  },
  qrTeamName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  cameraWrapper: {
    flex: 1,
    width: "100%",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  scanText: {
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 5,
    borderRadius: 5,
    fontSize: 10,
    fontWeight: "bold",
  },
  qrMenuText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 2,
  },
  teamSection: { marginBottom: 20, marginTop: 5 },
  teamBadge: {
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  teamLabel: { color: "#666", fontSize: 8, fontWeight: "bold" },
  teamNameText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  noTeamRow: { flexDirection: "row", gap: 10 },
  actionButton: {
    backgroundColor: COLOR.primary,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  createOutline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLOR.primary,
  },
  actionButtonText: { color: "#000", fontSize: 10, fontWeight: "bold" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 16,
    paddingVertical: 12,
  },
  statBox: { flex: 1, alignItems: "center" },
  statLabel: {
    color: "#555",
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignSelf: "center",
  },
});
