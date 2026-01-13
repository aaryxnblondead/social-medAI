import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { lightTheme } from '../theme/colors';

export default function FAB({ onPress, icon = '+', bottom = 120, theme = lightTheme }) {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          bottom,
          backgroundColor: theme.primary,
          shadowColor: theme.primary,
        },
      ]}
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
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  icon: {
    fontSize: 30,
    color: '#FFF',
    fontWeight: '600',
  },
});
