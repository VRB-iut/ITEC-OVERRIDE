import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import COLOR from '../var/COLOR';
import IP from '../var/IP';

export default function ProfileContainer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

const fetchUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }

      const response = await fetch(`http://${IP}:3000/user/${userId}`);
      const result = await response.json();

      if (result.success) {
        const wins = result.user.battlesWon || 0;
        const losses = result.user.battlesLost || 0;
        const ratio = (wins / (losses || 1)).toFixed(2);

        setData({
          username: result.user.username,
          WLratio: ratio,
          wins: result.user.battlesWon,
          losses: result.user.battlesLost,
          teamName: result.user.teamName,
          teamColor: result.user.teamColor
        });
      }
      setLoading(false);
    } catch (error) {
      console.error("Eroare la fetch profil:", error);
      setLoading(false);
    }
};

  return (
    <View style={styles.container}>
      <View style={styles.ProfileInfoContainer}>
        <View style={{ width: '90%'}}>
        <Text style={styles.numeUser}>{data?.username || 'User'}</Text>
        <View style={styles.teamContainer}>
        <Text style={styles.team}>Team</Text>
        {data?.teamName ? ( 
          <Text style={styles.teamName}>{data.teamName}</Text>
        ):(
          <View style={styles.noTeamContainer}>
            <TouchableOpacity onPress={() => router.replace("/CreateTeam")} style={styles.noTeamButton}>
              <Text style={styles.noTeamName}>Create Team</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace("/JoinTeam")} style={styles.noTeamButton}>
              <Text style={styles.noTeamName}>Join Team</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
        </View>
      <TouchableOpacity style={{marginVertical: 10}} onPress={() => router.replace("/LogInScreen")}>
        <Ionicons name="log-in" size={24} color={COLOR.primary} />
      </TouchableOpacity>
      </View>
      <View style={{borderWidth : 1, borderColor: COLOR.borderColor, width: '100%'}}></View>
      <View style={styles.StatsContainer}>
        <Text style={styles.WLratio}>W: {data?.wins || 'N/A'}</Text>
        <Text style={styles.WLratio}>L: {data?.losses || 'N/A'}</Text>
        <Text style={styles.WLratio}>W/L: {data?.WLratio > 0 ? data.WLratio : 'N/A'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '10%',
    padding: 20,
    borderWidth: 2,
    borderColor: COLOR.borderColor,
    borderRadius: 20,
    width: '90%',
    alignItems: 'center',
  },
  ProfileInfoContainer: {
    backgroundColor: COLOR.background,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: 15,
  },
  numeUser: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
  },
  WLratio: {
    fontSize: 18,
    color: 'white',
  },
  team: {
    fontSize: 12,
    color: '#b5b5b5',
  },
  teamName: {
    fontSize: 16,
    color: 'white',
  },
  teamContainer: {
    gap: 5,
    marginBottom: '5%',
  },
  noTeamContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 5,
  },
  noTeamButton: {
    borderWidth: 1,
    borderColor: COLOR.primary,
    backgroundColor: COLOR.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  noTeamName: {
    fontSize: 13,
    color: 'white',
  },
  StatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  }
});

