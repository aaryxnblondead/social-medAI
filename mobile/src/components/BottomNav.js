import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';

export default function BottomNav({ active, navigation, routes }) {
  const styles = themeStyles(lightTheme);
  
  const tabs = [
    { name: 'Dashboard', icon: '🏠', route: 'Dashboard' },
    { name: 'Generate', icon: '✨', route: 'Generate' },
    { name: 'Analytics', icon: '📊', route: 'Analytics' },
    { name: 'Settings', icon: '⚙️', route: 'ConnectAccounts' },
  ];

  return (
    <View style={localStyles.container}>
      {tabs.map((tab) => {
        const isActive = active === tab.route;
        return (
          <TouchableOpacity
            key={tab.route}
            style={localStyles.tab}
            onPress={() => navigation.navigate(tab.route, routes[tab.route])}
            activeOpacity={0.7}
          >
            <Text style={[localStyles.icon, isActive && { transform: [{ scale: 1.1 }] }]}>
              {tab.icon}
            </Text>
            <Text style={[localStyles.label, isActive && { color: lightTheme.primary, fontWeight: '600' }]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E9ED',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#8E8E93',
  },
});
