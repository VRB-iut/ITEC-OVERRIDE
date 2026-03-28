import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

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
    backgroundColor: '#1C1C1E',
    padding: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  info: {
    color: '#AAA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});