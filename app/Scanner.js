import { Alert, StyleSheet, Text, View } from 'react-native';
import COLOR from '../var/COLOR';

export default function Scanner() {
  const onScanPress = () => {
    Alert.alert('Scanare', 'Se scanează...');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanner</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR.background,
    padding: 20,
  },
  title: {
    color: COLOR.secondary,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});