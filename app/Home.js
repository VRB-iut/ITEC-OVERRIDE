import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import COLOR from "../var/COLOR";
import IP from "../var/IP";

import MatchCard from "../components/MatchCard";
import ProfileScreen from "./Profile";
import Scanner from "./Scanner";

const HomePage = () => {
  const [data, setData] = useState({ user: null, team: null, history: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;
      const idParsed = parseInt(userId);

      const teamResponse = await fetch(`http://${IP}:3000/teams`);
      const teamResult = await teamResponse.json();

      const userResponse = await fetch(`http://${IP}:3000/users`);
      const userResult = await userResponse.json();

      if (teamResult.success && userResult.success) {
        const myTeam = teamResult.teams.find((t) =>
          t.members.some((m) => m.id === idParsed),
        );

        const me = userResult.users.find((u) => u.id === idParsed) || {
          username: `User #${userId}`,
          id: userId,
        };

        let matchHistory = [];
        if (myTeam) {
          const historyRes = await fetch(
            `http://${IP}:3000/team-history/${myTeam.id}`,
          );
          const historyResult = await historyRes.json();
          if (historyResult.success) matchHistory = historyResult.history;
        }

        setData({ user: me, team: myTeam, history: matchHistory });
      }
    } catch (error) {
      console.log("Eroare fetch:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading)
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: COLOR.background }]}
      >
        <ActivityIndicator size="large" color={COLOR.primary} />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: COLOR.background }}>
      <View style={styles.customHeader}>
        <Text style={styles.welcomeText}>
          BINE AI VENIT, {data.user?.username?.toUpperCase() || "UTILIZATOR"}
        </Text>
        <Text style={styles.statusText}>
          {data.team ? data.team.name : "No team"}
        </Text>
      </View>

      <FlatList
        data={data.history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MatchCard
            result={item.result}
            opponent={item.opponent}
            date={item.date}
            percentage={item.percentage}
            opponentColor={item.opponentColor}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLOR.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.noTeamBox}>
            <Ionicons name="stats-chart-outline" size={50} color="#444" />
            <Text style={{ color: "white", marginTop: 10 }}>
              Nicio bătălie înregistrată.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />
    </View>
  );
};

function CustomTabBar({ state, navigation }) {
  // --- LOGICA TA DE ASCUNDERE ---
  const currentRouteName = state.routes[state.index].name;

  if (currentRouteName === "ScanBattle") {
    return null; // Bara dispare complet când ești pe ecranul de Scan
  }

  return (
    <View style={styles.tabBarContainer}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Dashboard")}
      >
        <Ionicons
          name="grid"
          size={26}
          color={state.index === 0 ? COLOR.primary : "#8E8E93"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("ScanBattle")}
      >
        <View style={styles.scanButton}>
          <Ionicons name="scan-outline" size={20} color="#fff" />
          <Text style={styles.scanText}>SCAN</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <Ionicons
          name="person"
          size={26}
          color={state.index === 2 ? COLOR.primary : "#8E8E93"}
        />
      </TouchableOpacity>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function Home() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard" component={HomePage} />
      <Tab.Screen name="ScanBattle" component={Scanner} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  customHeader: { paddingTop: 60, paddingHorizontal: 25, paddingBottom: 20 },
  welcomeText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statusText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  noTeamBox: { marginTop: 100, alignItems: "center", justifyContent: "center" },
  tabBarContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 5,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: "rgba(25, 25, 25, 0.7)",
    borderRadius: 35,
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 0,
    shadowOpacity: 0,
  },
  tabButton: { flex: 1, justifyContent: "center", alignItems: "center" },
  scanButton: {
    flexDirection: "row",
    backgroundColor: COLOR.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    alignItems: "center",
  },
  scanText: { color: "#fff", fontWeight: "900", marginLeft: 5 },
});
