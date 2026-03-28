import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  const [loading, setLoading] = useState(true);
  const [showQRMenu, setShowQRMenu] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // Comută între opțiuni și cameră
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [scanning, setScanning] = useState(false);
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
          teamColor: result.user.teamColor || COLOR.primary,
          password: result.user.teamPassword, // Trimitem și parola în QR pentru auto-join
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
      // Format QR: teamName:password
      const [tName, tPass] = qrRawData.split(":");
      const userId = await AsyncStorage.getItem("userId");

      if (!tName || !tPass) throw new Error("Format invalid");

      const response = await fetch(`http://${IP}:3000/join-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: tName, password: tPass, userId }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Succes", `Te-ai alăturat echipei ${result.teamName}!`);
        setShowQRMenu(false);
        setIsScanning(false);
        fetchUserData();
      } else {
        Alert.alert("Eroare", result.message || "Nu s-a putut face join.");
      }
    } catch (error) {
      Alert.alert("Eroare Scanare", "Codul QR nu este valid.");
    } finally {
      setTimeout(() => setScanning(false), 2000);
    }
  };

  const toggleQRMenu = async () => {
    if (!showQRMenu && !permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permisiune refuzată", "Accesul la cameră este necesar.");
        return;
      }
    }
    setShowQRMenu(!showQRMenu);
    setIsScanning(false); // Resetăm la meniu când închidem/deschidem
  };

  // Datele trimise prin QR: NumeEchipă:Parolă
  const qrValue = `${data?.teamName}:${data?.password}`;

  return (
    <View style={styles.cardContainer}>
      {loading ? (
        <ActivityIndicator size="large" color={COLOR.primary} />
      ) : (
        <>
          {/* HEADER SECTION */}
          <View style={styles.headerSection}>
            <View style={styles.textGroup}>
              <Text style={styles.label}>PROFILE</Text>
              <Text style={styles.usernameText} numberOfLines={1}>
                {data?.username || "Utilizator"}
              </Text>
            </View>

            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={toggleQRMenu}
                style={[
                  styles.iconButton,
                  showQRMenu && { borderColor: COLOR.primary },
                ]}
              >
                <Ionicons
                  name={showQRMenu ? "close-outline" : "qr-code-outline"}
                  size={22}
                  color={showQRMenu ? COLOR.primary : "#fff"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.replace("/LogInScreen")}
                style={styles.iconButton}
              >
                <Ionicons name="log-out-outline" size={22} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>

          {/* QR MENU / CAMERA AREA */}
          {showQRMenu && (
            <View style={styles.qrMenuContainer}>
              {isScanning ? (
                <View style={styles.cameraWrapper}>
                  <CameraView
                    style={styles.camera}
                    onBarcodeScanned={
                      scanning ? undefined : handleBarCodeScanned
                    }
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  />
                  <TouchableOpacity
                    style={styles.backToMenuBtn}
                    onPress={() => setIsScanning(false)}
                  >
                    <Text style={styles.backToMenuText}>ÎNAPOI</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.menuContent}>
                  <TouchableOpacity
                    style={styles.qrMenuItem}
                    onPress={() => setIsScanning(true)}
                  >
                    <Ionicons
                      name="scan-outline"
                      size={20}
                      color={COLOR.primary}
                    />
                    <Text style={styles.qrMenuText}>JOIN (SCAN QR)</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.qrMenuItem}
                    onPress={() => {
                      if (!data?.teamName) {
                        Alert.alert(
                          "Eroare",
                          "Trebuie să ai o echipă pentru a genera un cod.",
                        );
                      } else {
                        setShowInviteModal(true);
                        setShowQRMenu(false);
                      }
                    }}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={20}
                      color={COLOR.primary}
                    />
                    <Text style={styles.qrMenuText}>INVITE (MY QR)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* TEAM SECTION */}
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

          {/* STATS ROW */}
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

      {/* INVITE MODAL */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>INVITĂ ÎN ECHIPĂ</Text>
            <Text style={styles.modalSubTitle}>{data?.teamName}</Text>
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrValue}
                size={180}
                color="white"
                backgroundColor="transparent"
              />
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.closeBtnText}>ÎNCHIDE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // CONTAINERUL PRINCIPAL (CARDUL)
  cardContainer: {
    position: "absolute",
    top: 50,
    backgroundColor: COLOR.borderColor, // Fundalul închis (Antracit)
    width: "92%",
    alignSelf: "center",
    padding: 22,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    // Umbre pentru profunzime
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // HEADER: Username și Butoane
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  textGroup: { flex: 1 },
  label: {
    color: "#666",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  usernameText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  // MENIUL CONTEXTUAL QR & CAMERA
  qrMenuContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 22,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  menuContent: {
    padding: 8,
  },
  qrMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 15,
  },
  qrMenuText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginHorizontal: 18,
  },

  // SCANNER SETTINGS
  cameraWrapper: {
    height: 240,
    width: "100%",
    backgroundColor: "#000",
  },
  camera: { flex: 1 },
  backToMenuBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  backToMenuText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  // SECȚIUNEA ECHIPĂ (TEAM)
  teamSection: {
    marginBottom: 22,
  },
  teamBadge: {
    padding: 15,
    borderRadius: 16,
    borderLeftWidth: 5,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
  },
  teamLabel: {
    color: "#555",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
  },
  teamNameText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  noTeamRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    backgroundColor: COLOR.primary,
    paddingVertical: 14,
    borderRadius: 15,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  createOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLOR.primary,
  },
  actionButtonText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },

  // STATISTICI (WINS / LOSSES)
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.02)",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: "#444",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 5,
    letterSpacing: 0.5,
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignSelf: "center",
  },

  // MODAL (INVITE QR)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#161616",
    padding: 35,
    borderRadius: 35,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    elevation: 20,
  },
  modalTitle: {
    color: "#555",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  modalSubTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 30,
  },
  qrWrapper: {
    padding: 22,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 24,
    marginBottom: 35,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  closeBtn: {
    backgroundColor: COLOR.primary,
    paddingVertical: 16,
    paddingHorizontal: 45,
    borderRadius: 18,
    shadowColor: COLOR.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  closeBtnText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 14,
  },
});
