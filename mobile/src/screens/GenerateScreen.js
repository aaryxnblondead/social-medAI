import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { themeStyles } from '../theme/colors';
import TrendCard from '../components/TrendCard';
import LoadingState from '../components/LoadingState';
import BottomNav from '../components/BottomNav';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';

const categories = ['technology', 'culture', 'finance', 'travel'];

export default function GenerateScreen({ navigation, route }) {
  const { api, token, brand, theme } = useApp();
  const { selectedTrend } = route.params || {};
  const [trends, setTrends] = useState([]);
  const [connections, setConnections] = useState({});
  const [category, setCategory] = useState('technology');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const styles = themeStyles(theme);

  useEffect(() => {
    loadTrends();
  }, [category]);

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    if (selectedTrend) generate(selectedTrend);
  }, [selectedTrend]);

  async function loadTrends() {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/trends?category=${encodeURIComponent(category)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrends(res.data.items || []);
    } catch (e) {
      console.log('Trends error:', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadConnections() {
    try {
      const res = await api.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setConnections(res.data?.user?.socialAccounts || {});
    } catch {}
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadTrends();
    setRefreshing(false);
  }

  async function generate(trend) {
    setGenerating(true);
    try {
      const res = await api.post(
        '/api/v1/posts/generate',
        { brandId: brand?._id, platform: 'twitter', trendId: trend?.id || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigation.navigate('PreviewPublish', { draft: res.data });
    } catch (e) {
      alert('Generate failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <LoadingState
        theme={theme}
        messages={['Analyzing trend...', 'Crafting copy...', 'Generating graphics...', 'Almost there...']}
      />
    );
  }

  const badges = [
    { key: 'twitter', label: 'Twitter' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
  ];

  return (
    <View style={[styles.screen, { paddingHorizontal: 0 }]}> 
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingHorizontal: 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <View style={localStyles.badgeRow}>
          {badges.map((badge) =>
            connections?.[badge.key]?.connected ? (
              <View key={badge.key} style={styles.badge}>
                <Text style={styles.badgeText}>{badge.label} ✓</Text>
              </View>
            ) : null
          )}
        </View>

        <Text style={styles.title}>Intelligence feed</Text>
        <Text style={styles.subtitle}>Data sources: Twitter, NewsAPI, brand memory, RL coach.</Text>

        <View style={localStyles.chipRow}>
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? theme.primary : theme.border,
                    backgroundColor: active ? theme.chip : styles.chip.backgroundColor,
                  },
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, { color: active ? theme.primary : theme.text }]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <LoadingState theme={theme} message="Loading trends..." />
        ) : trends.length === 0 ? (
          <EmptyState
            theme={theme}
            icon="🔍"
            title="No signals"
            message="Switch categories or refresh to pull from NewsAPI + Reddit again."
            buttonText="Refresh"
            onPress={onRefresh}
          />
        ) : (
          trends.map((trend, idx) => (
            <TrendCard key={trend.id || idx} theme={theme} trend={trend} score={9 - idx} onPress={() => generate(trend)} />
          ))
        )}
      </ScrollView>

      <BottomNav
        theme={theme}
        active="Generate"
        navigation={navigation}
        routes={{ Dashboard: {}, Generate: {}, Analytics: {}, ConnectAccounts: {} }}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 20,
  },
});
