import { StyleSheet, Text, View } from 'react-native';

import COLOR from '../var/COLOR';

import LogOutButton from '../components/logOut';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>
      <LogOutButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.background,
  },
  title: {
    color: COLOR.secondary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtext: {
    color: COLOR.secondary,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});