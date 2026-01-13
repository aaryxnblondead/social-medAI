import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { lightTheme } from '../theme/colors';

export default function BottomNav({ active, navigation, routes = {}, theme = lightTheme }) {
  const tabs = [
    { name: 'Dashboard', icon: '🏠', route: 'Dashboard' },
    { name: 'Generate', icon: '✨', route: 'Generate' },
    { name: 'Analytics', icon: '📊', route: 'Analytics' },
    { name: 'Settings', icon: '⚙️', route: 'ConnectAccounts' },
  ];

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.route;
          return (
            <TouchableOpacity
              key={tab.route}
              style={[styles.tab, isActive && { backgroundColor: theme.chip }]}
              onPress={() => navigation.navigate(tab.route, routes[tab.route])}
              activeOpacity={0.8}
            >
              <Text style={[styles.icon, { color: isActive ? theme.primary : theme.textMuted }]}>
                {tab.icon}
              </Text>
              <Text style={[styles.label, { color: isActive ? theme.primary : theme.textMuted }]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '92%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 24,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
