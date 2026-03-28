import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";

export default function LogOutButton() {
  const router = useRouter();

  const handleLogOut = async () => {
    try {
      await AsyncStorage.removeItem("userId");
      
      router.replace("/LogInScreen");
    } catch (error) {
      console.log("Eroare la Log Out:", error);
    }
  };
  return (
    <TouchableOpacity onPress={handleLogOut} style={{ padding: 10 }}>
      <Text style={{ color: 'red', fontWeight: 'bold' }}>Log Out</Text>
    </TouchableOpacity>
  );
}
