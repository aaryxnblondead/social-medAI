import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';

export default function EmptyState({ icon = '📭', title, message, buttonText, onPress, theme = lightTheme }) {
  const styles = themeStyles(theme);
  
  return (
    <View style={[localStyles.container, { backgroundColor: theme.cardSoft, borderColor: theme.border }]}>
      <Text style={localStyles.icon}>{icon}</Text>
      <Text style={[styles.heading, { marginTop: 16, textAlign: 'center' }]}>{title}</Text>
      <Text style={[styles.body, { marginTop: 8, textAlign: 'center', color: theme.textMuted }]}>
        {message}
      </Text>
      {buttonText && onPress && (
        <TouchableOpacity style={[styles.buttonPrimary, { marginTop: 24 }]} onPress={onPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
  },
  icon: {
    fontSize: 64,
  },
});
