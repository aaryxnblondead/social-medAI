import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { lightTheme } from '../theme/colors';

export default function FAB({ onPress, icon = '+', bottom = 90 }) {
  return (
    <TouchableOpacity
      style={[styles.fab, { bottom }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Text style={styles.icon}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: lightTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  icon: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: '300',
  },
});
