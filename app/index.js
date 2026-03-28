import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator } from 'react-native';

export default function App() {
const [isLoggedIn, setIsLoggedIn] = useState(null);

useEffect(() => {
  checkLoginStatus();
}, []);

const checkLoginStatus = async () => {
  const userId = await AsyncStorage.getItem('userId');

  if(!userId) {
    setIsLoggedIn(false);
  } else {
    setIsLoggedIn(true);
  }
};

if(isLoggedIn == null) {
  return <ActivityIndicator size="large" color="#0000ff" />;
} 

return isLoggedIn ? <Redirect href="/Home" /> : <Redirect href="/LogInScreen" />;
}
