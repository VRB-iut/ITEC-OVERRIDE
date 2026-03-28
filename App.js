import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';


import ProfileScreen from './Profile'; 
import Scanner from './Scanner';       


const HomePage = () => (
  <View style={{ flex: 1, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    }}>Home</Text>
  </View>
);

const Tab = createBottomTabNavigator();


function CustomTabBar({ state, descriptors, navigation }) {
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
          color={state.index === 0 ? '#AF52DE' : '#8E8E93'}
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
          color={state.index === 2 ? '#AF52DE' : '#8E8E93'}
        />
      </TouchableOpacity>

    </View>
  );
}

// --- Navigator ---
function MainNavigator() {
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

// --- App ---
export default function App() {
  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
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
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#AF52DE',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#AF52DE',
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