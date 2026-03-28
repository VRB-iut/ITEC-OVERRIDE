import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import COLOR from "../var/COLOR";
import IP from "../var/IP";

export default function ProfileContainer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <View style={styles.cardContainer}>
      {/* Secțiunea Superioară: Header Profil */}
      <View style={styles.headerSection}>
        <View style={styles.textGroup}>
          <Text style={styles.label}>PROFIL UTILIZATOR</Text>
          <Text style={styles.usernameText} numberOfLines={1}>
            {data?.username || "Incarcare..."}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.replace("/LogInScreen")}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>

      {/* Secțiunea de Mijloc: Echipa */}
      <View style={styles.teamSection}>
        {data?.teamName ? (
          <View style={[styles.teamBadge, { borderLeftColor: data.teamColor }]}>
            <Text style={styles.teamLabel}>ECHIPĂ ACTIVĂ</Text>
            <Text style={styles.teamNameText}>{data.teamName}</Text>
          </View>
        ) : (
          <View style={styles.noTeamRow}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>JOIN TEAM</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: "transparent", borderWidth: 1 },
              ]}
            >
              <Text style={styles.actionButtonText}>CREATE</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Secțiunea Inferioară: Stats (Același stil cu cardul de meci) */}
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
          <Text style={styles.statLabel}>W/L RATIO</Text>
          <Text style={styles.statValue}>{data?.WLratio ?? "0.00"}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    top: 20,
    backgroundColor: COLOR.borderColor, // Fundalul închis din Home
    width: "90%",
    alignSelf: "center",
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    // Umbră subtilă
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  headerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  textGroup: { flex: 1 },
  label: {
    color: "#666",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  usernameText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: "rgba(244, 67, 54, 0.1)",
    borderRadius: 10,
  },
  teamSection: {
    marginBottom: 20,
  },
  teamBadge: {
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  teamLabel: {
    color: "#666",
    fontSize: 9,
    fontWeight: "bold",
  },
  teamNameText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noTeamRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    backgroundColor: COLOR.primary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "bold",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    paddingVertical: 15,
    justifyContent: "space-around",
    alignItems: "center",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    color: "#555",
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  statDivider: {
    width: 1,
    height: "60%",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});
