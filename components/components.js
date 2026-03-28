import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProfileScreen from '../Profile';
import Scanner from '../Scanner';

const Tab = createBottomTabNavigator();

const HomePage = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenTitle}>Home Screen</Text>
  </View>
);

const ScanBattleScreen = Scanner;

const CustomScanButton = ({ onPress }) => (
  <TouchableOpacity style={styles.scanButtonContainer} onPress={onPress}>
    <View style={styles.scanPlaceholderNav}>
      <Text style={styles.scanText}>SCAN & BATTLE</Text>
    </View>
  </TouchableOpacity>
);

const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: styles.tabBarStyle,
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: '#8E8E93',
    }}
  >
    <Tab.Screen
      name="Home"
      component={HomePage}
      options={{
        tabBarIcon: ({ color }) => (
          <View style={styles.navIconButton}>
            <Ionicons name="home" size={24} color={color} />
          </View>
        ),
      }}
    />
    <Tab.Screen
      name="ScanBattle"
      component={ScanBattleScreen}
      options={{
        tabBarButton: (props) => <CustomScanButton {...props} />,
      }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarIcon: ({ color }) => (
          <View style={styles.navIconButton}>
            <Ionicons name="person" size={24} color={color} />
          </View>
        ),
      }}
    />
  </Tab.Navigator>
);

export default MainNavigator;

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: '#E5E5EA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: 90,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    borderTopWidth: 0,
    paddingHorizontal: 10,
  },
  navIconButton: {
    width: 50,
    height: 50,
    backgroundColor: '#D1D1D6',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonContainer: {
    top: -15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanPlaceholderNav: {
    borderWidth: 2,
    borderColor: '#AF52DE',
    borderStyle: 'dashed',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 25,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#AF52DE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  scanText: {
    color: '#AF52DE',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
});