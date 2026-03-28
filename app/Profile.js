import { StyleSheet, View } from 'react-native';

import COLOR from '../var/COLOR';

import ProfileContainer from '../components/profileContainer';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <ProfileContainer />
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