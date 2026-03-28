import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userId');
    router.replace('/LogInScreen');
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity onPress={handleLogout} style={{ padding: 20, backgroundColor: 'red', alignSelf: 'center', marginTop: 50 }}>
        <Text>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

