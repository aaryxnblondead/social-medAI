import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { themeStyles } from '../theme/colors';
import BottomNav from '../components/BottomNav';
import { useApp } from '../context/AppContext';

const platforms = [
  { id: 'twitter', name: 'Twitter', icon: '𝕏', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: 'f', color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
];

export default function ConnectAccountsScreen({ navigation }) {
  const { api, token, theme } = useApp();
  const styles = themeStyles(theme);
  const [status, setStatus] = useState({});
  const [scopes, setScopes] = useState({});

  useEffect(() => {
    refreshStatus();
    fetchScopes();
  }, []);

  async function connect(platform) {
    try {
      const res = await api.get(`/api/v1/oauth/${platform}/auth-url`, { headers: { Authorization: `Bearer ${token}` } });
      const url = res.data?.url;
      if (!url) return alert('No URL');
      await Linking.openURL(url);
    } catch (e) {
      alert('Connect failed: ' + (e.response?.data?.error || e.message));
    }
  }

  async function refreshStatus() {
    try {
      const res = await api.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setStatus(res.data?.user?.socialAccounts || {});
    } catch {}
  }

  async function fetchScopes() {
    try {
      const [tw, li, fb, ig] = await Promise.all([
        api.get('/api/v1/oauth/twitter/recommended-scopes', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/v1/oauth/linkedin/recommended-scopes', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/v1/oauth/facebook/recommended-scopes', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/api/v1/oauth/instagram/recommended-scopes', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setScopes({ twitter: tw.data.scopes, linkedin: li.data.scopes, facebook: fb.data.scopes, instagram: ig.data.scopes });
    } catch {}
  }

  return (
    <View style={[styles.screen, { paddingHorizontal: 0 }]}> 
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingHorizontal: 20 }]}> 
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Matches the reference grid with automation + danger zone.</Text>

        <View style={localStyles.grid}>
          {platforms.map((platform) => {
            const isConnected = status?.[platform.id]?.connected;
            return (
              <View key={platform.id} style={[styles.card, localStyles.settingCard]}> 
                <View style={[localStyles.icon, { backgroundColor: platform.color }]}>
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>{platform.icon}</Text>
                </View>
                <Text style={styles.heading}>{platform.name}</Text>
                <Text style={[styles.caption, { textAlign: 'center', marginTop: 4 }]}>
                  {scopes[platform.id]?.slice(0, 2).join(', ') || 'Full permissions'}
                </Text>
                {isConnected ? (
                  <Text style={[styles.body, { color: theme.primary, marginTop: 10 }]}>Connected ✓</Text>
                ) : (
                  <TouchableOpacity
                    style={[styles.buttonPrimary, { marginTop: 10, paddingVertical: 10 }]}
                    onPress={() => connect(platform.id)}
                  >
                    <Text style={styles.buttonText}>Connect</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={[styles.card, localStyles.dangerCard]}> 
          <Text style={[styles.heading, { marginBottom: 8 }]}>Danger zone</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>Log out or wipe data per GDPR (see PRODUCTION_IMPLEMENTATION doc).</Text>
          <View style={localStyles.dangerActions}>
            <TouchableOpacity style={styles.buttonOutline} onPress={() => alert('Logged out (mock)')}> 
              <Text style={[styles.buttonOutlineText, { color: '#B9382D' }]}>Log out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttonPrimary, { backgroundColor: '#B9382D' }]} onPress={() => alert('Account deletion requested (mock)')}>
              <Text style={styles.buttonText}>Delete account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={[styles.buttonOutline, { marginTop: 20 }]} onPress={refreshStatus}>
          <Text style={styles.buttonOutlineText}>Refresh status</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav
        theme={theme}
        active="ConnectAccounts"
        navigation={navigation}
        routes={{ Dashboard: {}, Generate: {}, Analytics: {}, ConnectAccounts: {} }}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  settingCard: {
    width: '48%',
    alignItems: 'center',
    borderRadius: 24,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dangerCard: {
    marginTop: 24,
    backgroundColor: '#FBE8E8',
    borderColor: '#F5C2C0',
  },
  dangerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
});
