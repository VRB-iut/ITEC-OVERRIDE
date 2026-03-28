import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import COLOR from '../var/COLOR';
import IP from '../var/IP';

// Definim opțiunile de culori
const COLOR_OPTIONS = [
  { id: '1', hex: '#32CD32', name: 'Lime' },
  { id: '2', hex: '#AF52DE', name: 'Purple' },
  { id: '3', hex: '#007AFF', name: 'Blue' },
  { id: '4', hex: '#FF9500', name: 'Orange' },
  { id: '5', hex: '#FF3B30', name: 'Red' },
  { id: '6', hex: '#b030ff', name: 'Purple' },
  { id: '7', hex: '#4cff30', name: 'Lime' },
  { id: '8', hex: '#ff30a9', name: 'Pink' },
];

export default function CreateTeam() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].hex);

  const handleCreateTeam = async () => {
    const normalizedTeamName = teamName.trim();
    const normalizedPassword = password.trim();

    if (!normalizedTeamName || !normalizedPassword) {
      Alert.alert("Eroare", "Te rugăm să completezi toate câmpurile.");
      return;
    }

    try {
      const storedUserId = await AsyncStorage.getItem('userId');

      if (!storedUserId) {
        Alert.alert("Eroare", "Sesiunea a expirat. Te rugăm să te loghezi din nou.");
        router.replace('/LogInScreen');
        return;
      }

      const response = await fetch(`http://${IP}:3000/create-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          teamName: normalizedTeamName,
          userId: parseInt(storedUserId, 10),
          password: normalizedPassword,
          colorHex: selectedColor 
        })
      });

      const data = await response.json();

      if (data.success) {
        setTeamName('');
        setPassword('');
        router.replace('/Home')
      } else {
        Alert.alert("Eroare", data.message || "Ceva nu a mers bine.");
      }
    } catch (error) {
      console.log("Network Error:", error);
      Alert.alert("Eroare", "Nu s-a putut conecta la server.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: COLOR.background }]}>
      <View style={styles.userInputContainer}>
        
        <Text style={styles.text}>Team Name:</Text>
        <TextInput             
          style={styles.inputField}
          placeholder='Nume echipa...'
          placeholderTextColor="#ccc"
          value={teamName}
          onChangeText={setTeamName}
          autoCapitalize='none'/>

        <Text style={styles.text}>Team Password:</Text>
        <TextInput             
          style={styles.inputField}
          placeholder='Parola echipa...'
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={setPassword}
          secureTextEntry // Ascunde parola
          autoCapitalize='none'/>

        <Text style={styles.text}>Select Team Color:</Text>
        <View style={styles.colorPickerContainer}>
          {COLOR_OPTIONS.map((color) => (
            <TouchableOpacity
              key={color.id}
              onPress={() => setSelectedColor(color.hex)}
              style={[
                styles.colorCircle,
                { backgroundColor: color.hex },
                selectedColor === color.hex && styles.selectedCircle
              ]}
            />
          ))}
        </View>

      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.buttonButton} onPress={handleCreateTeam}>
          <Text style={styles.ButtonText}>Create Team</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  userInputContainer: {
    width: '85%',
    gap: 15,
    alignItems: 'center',
    backgroundColor: COLOR.primary,
    padding: 20,
    borderRadius: 15,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  inputField: {
    alignSelf: 'flex-start',
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 9,
    borderColor: COLOR.borderColor,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    padding: 10,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
    marginBottom: 10,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCircle: {
    borderColor: 'white',
    transform: [{ scale: 1.4 }],
    zIndex: 1,
  },
  buttonContainer: {
    marginTop: 50,
  },
  buttonButton: {
    borderWidth: 2,
    backgroundColor: COLOR.primary,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderColor: COLOR.borderColor,
  },
  ButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});