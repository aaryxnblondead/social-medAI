import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';
import BottomNav from '../components/BottomNav';
import { useApp } from '../context/AppContext';

export default function ConnectAccountsScreen({ navigation }) {
  const { api, token, brand } = useApp();
  const [status, setStatus] = useState(null);
  const [scopes, setScopes] = useState({});
  const styles = themeStyles(lightTheme);

  useEffect(() => { refreshStatus(); fetchScopes(); }, []);

  async function connect(platform) {
    try {
      const res = await api.get(`/api/v1/oauth/${platform}/auth-url`, { headers: { Authorization: `Bearer ${token}` }});
      const url = res.data?.url;
      if (!url) return alert('No URL');
      await Linking.openURL(url);
    } catch (e) {
      alert('Connect failed: ' + (e.response?.data?.error || e.message));
    }
  }

  async function refreshStatus() {
    try {
      const res = await api.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` }});
      setStatus(res.data?.user?.socialAccounts || {});
    } catch {}
  }

  async function fetchScopes() {
    try {
      const [tw, li, fb, ig] = await Promise.all([
        api.get('/api/v1/oauth/twitter/recommended-scopes', { headers: { Authorization: `Bearer ${token}` }}),
        api.get('/api/v1/oauth/linkedin/recommended-scopes', { headers: { Authorization: `Bearer ${token}` }}),
        api.get('/api/v1/oauth/facebook/recommended-scopes', { headers: { Authorization: `Bearer ${token}` }}),
        api.get('/api/v1/oauth/instagram/recommended-scopes', { headers: { Authorization: `Bearer ${token}` }})
      ]);
      setScopes({
        twitter: tw.data.scopes,
        linkedin: li.data.scopes,
        facebook: fb.data.scopes,
        instagram: ig.data.scopes
      });
    } catch {}
  }

  const platforms = [
    { id: 'twitter', name: 'Twitter', icon: '𝕏', color: '#1DA1F2' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: '#0A66C2' },
    { id: 'facebook', name: 'Facebook', icon: 'f', color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Connected Accounts</Text>
        <Text style={[styles.body, { marginTop: 8, color: lightTheme.textSecondary }]}>
          Connect your social accounts to start publishing
        </Text>

        <View style={{ marginTop: 24 }}>
          {platforms.map((platform) => {
            const isConnected = status?.[platform.id]?.connected;
            return (
              <View key={platform.id} style={[styles.card, { marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[localStyles.platformIcon, { backgroundColor: platform.color }]}>
                    <Text style={{ color: '#FFF', fontSize: 20, fontWeight: '700' }}>{platform.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.heading, { fontSize: 18 }]}>{platform.name}</Text>
                    <Text style={styles.caption}>
                      {scopes[platform.id]?.slice(0, 2).join(', ') || 'Full permissions'}
                    </Text>
                  </View>
                  {isConnected ? (
                    <View style={[styles.badge, { backgroundColor: lightTheme.success + '20' }]}>
                      <Text style={[styles.badgeText, { color: lightTheme.success }]}>Connected ✓</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.buttonPrimary, { backgroundColor: platform.color, paddingHorizontal: 16, paddingVertical: 8 }]}
                      onPress={() => connect(platform.id)}
                    >
                      <Text style={[styles.buttonText, { fontSize: 14 }]}>Connect</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.buttonOutline, { marginTop: 20 }]} 
          onPress={refreshStatus}
        >
          <Text style={styles.buttonOutlineText}>Refresh Status</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <BottomNav 
        active="Settings" 
        navigation={navigation} 
        routes={{
          Dashboard: {},
          Generate: {},
          Analytics: {},
          ConnectAccounts: {},
        }}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
