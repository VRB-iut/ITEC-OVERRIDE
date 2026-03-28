import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import COLOR from '../var/COLOR';
import IP from '../var/IP';

import ProfileScreen from './Profile';
import Scanner from './Scanner';


const HomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const response = await fetch(`http://${IP}:3000/teams`);
    const result = await response.json();

    if (result.success) {
      const myTeam = result.teams.find(t => 
        t.members.some(m => m.id === parseInt(userId))
      );
      
      setData({
        team: myTeam,
        username: myTeam.members.find(m => m.id === parseInt(userId)).username,
        logs: []
      });
    }
    setLoading(false);
  } catch (error) {
     console.log(error);
  }
  };

  const renderBattle = ({ item }) => (
    <View style={styles.battleCard}>
      <Ionicons name="trophy" size={20} color="#FFD700" />
      <View style={{ marginLeft: 15 }}>
        <Text style={styles.battleText}>{item.action}</Text>
        <Text style={styles.battleDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  if (loading) return (
    <View style={[styles.screen, { justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={COLOR.primary} />
    </View>
  );return (
    <View style={{ flex: 1, backgroundColor: COLOR.background, justifyContent: 'center', alignItems: 'center' }}>
      <View style={styles.headerContainer}>
        <Text style={{color: "white"}}>ECHIPA: {data?.team?.name || 'Fără echipă'}</Text>
        <Text style={{color: "white"}}>Bătălii câștigate de {data?.username}</Text>
      </View>

      <FlatList
        data={data?.logs || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBattle}
        ListEmptyComponent={<Text style={{color: "white"}}>Nicio bătălie câștigată momentan.</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};


const Tab = createBottomTabNavigator();


function CustomTabBar({ state, navigation }) {
  return (
    <View style={styles.tabBarContainer}>
      
      {/* HOME */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons
          name="home"
          size={26}
          color={state.index === 0 ? COLOR.primary : '#8E8E93'}
        />
      </TouchableOpacity>

      {/* SCAN */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate('ScanBattle')}
        activeOpacity={0.8}
      >
        <View style={styles.scanButton}>
          <Ionicons name="scan-outline" size={20} color="#fff" />
          <Text style={styles.scanText}>SCAN</Text>
        </View>
      </TouchableOpacity>

      {/* PROFILE */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons
          name="person"
          size={26}
          color={state.index === 2 ? COLOR.primary : '#8E8E93'}
        />
      </TouchableOpacity>

    </View>
  );
}

export default function Home() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="ScanBattle" component={Scanner} /> 
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}


// --- STYLES ---
const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: COLOR.borderColor,
    borderRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tabButton: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: COLOR.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: COLOR.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  scanText: {
    color: '#fff',
    fontWeight: '900',
    marginLeft: 5,
    letterSpacing: 1,
  },
});