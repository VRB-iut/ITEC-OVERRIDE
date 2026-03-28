import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import COLOR from "../var/COLOR";
import IP from "../var/IP";

export default function ProfileContainer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQRMenu, setShowQRMenu] = useState(false);
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
          wins: wins,
          losses: losses,
          username: result.user.username,
          WLratio: ratio,
          teamName: result.user.teamName,
          teamColor: result.user.teamColor || COLOR.primary,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Eroare la fetch profil:", error);
      setLoading(false);
    }
  };

  const qrData = data?.teamName || "No Team Info";

  return (
    <View style={styles.cardContainer}>
      {/* HEADER: Nume și Butoane Acțiune */}
      <View style={styles.headerSection}>
        <View style={styles.textGroup}>
          <Text style={styles.label}>PROFILE</Text>
          <Text style={styles.usernameText} numberOfLines={1}>
            {data?.username || "Încărcare..."}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setShowQRMenu(!showQRMenu)}
            style={[
              styles.iconButton,
              showQRMenu && { borderColor: COLOR.primary },
            ]}
          >
            <Ionicons
              name="qr-code-outline"
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

      {/* MENIU CONTEXTUAL QR */}
      {showQRMenu && (
        <View style={styles.qrMenuContainer}>
          {/* Butonul de SCAN (Join) - Apare mereu */}
          <TouchableOpacity
            style={styles.qrMenuItem}
            onPress={() => {
              setShowQRMenu(false);
              router.push("/JoinScanner");
            }}
          >
            <Ionicons name="scan-outline" size={18} color={COLOR.primary} />
            <Text style={styles.qrMenuText}>JOIN (SCAN QR)</Text>
          </TouchableOpacity>

          {/* Butonul de INVITE - Apare DOAR dacă data.teamName există */}
          {data?.teamName && (
            <>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.qrMenuItem}
                onPress={() => {
                  setShowInviteModal(true);
                  setShowQRMenu(false);
                }}
              >
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={COLOR.primary}
                />
                <Text style={styles.qrMenuText}>INVITE (MY QR)</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* SECȚIUNE ECHIPĂ */}
      <View style={styles.teamSection}>
        {data?.teamName ? (
          <View style={[styles.teamBadge, { borderLeftColor: data.teamColor }]}>
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
              <Text style={[styles.actionButtonText, { color: COLOR.primary }]}>
                CREATE TEAM
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* STATISTICI */}
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

      {/* MODAL PENTRU INVITE (GENERARE QR) */}
      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite in Your Team</Text>
            <Text style={styles.modalSubTitle}>{data?.teamName}</Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={"data.teamName:data.teampassword"} // Poți personaliza structura datelor după cum ai nevoie
                size={200}
                color="white"
                backgroundColor="transparent"
              />
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInviteModal(false)}
            >
              <Text style={styles.closeButtonText}>BACK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 15,
    padding: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  qrMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 12,
  },
  qrMenuText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  menuDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginHorizontal: 10,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#1a1a1a",
    padding: 30,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 5,
  },
  modalSubTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 25,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    marginBottom: 25,
  },
  closeButton: {
    backgroundColor: COLOR.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  closeButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
  },
});
