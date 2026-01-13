import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { themeStyles } from '../theme/colors';
import TrendCard from '../components/TrendCard';
import PostGrid from '../components/PostGrid';
import FAB from '../components/FAB';
import BottomNav from '../components/BottomNav';
import { useApp } from '../context/AppContext';

export default function DashboardScreen({ navigation }) {
  const { api, token, brand, theme } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [trends, setTrends] = useState([]);
  const [posts, setPosts] = useState([]);
  const styles = themeStyles(theme);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const trendsRes = await api.get('/api/v1/trends?category=technology', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrends((trendsRes.data.items || []).slice(0, 4));

      if (brand?._id) {
        const postsRes = await api.get(`/api/v1/analytics/${brand._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(
          Array(7)
            .fill(null)
            .map((_, i) => (i < (postsRes.data?.published || 0) ? { status: 'published' } : null))
        );
      }
    } catch (e) {
      console.log('Dashboard load error:', e.message);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  return (
    <View style={[styles.screen, { paddingHorizontal: 0 }]}> 
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingHorizontal: 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <View style={[styles.card, localStyles.heroCard]}> 
          <View style={localStyles.heroHeader}>
            <View style={[localStyles.avatar, { backgroundColor: theme.chip }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.heading, { fontSize: 22 }]}>{brand?.name || 'Your Workspace'}</Text>
              <Text style={styles.caption}>{brand?.industry || 'Select industry'} · {brand?.persona || 'Brand team'}</Text>
            </View>
            <TouchableOpacity style={[styles.badge, { backgroundColor: theme.chip }]}> 
              <Text style={[styles.badgeText, { color: theme.primary }]}>Live</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.body, { marginTop: 16, color: theme.textMuted }]}>Inspired by the profile card in your reference, this area surfaces at-a-glance health plus a CTA into collaborations.</Text>

          <View style={localStyles.metricsGrid}>
            {[
              { label: 'Followers', value: '456K' },
              { label: 'Engagement', value: '5.2%' },
              { label: 'Avg Reach', value: '1.2M' },
              { label: 'Insights', value: '7 active' },
            ].map((metric) => (
              <View key={metric.label} style={localStyles.metricTile}>
                <Text style={[styles.caption, { textTransform: 'uppercase' }]}>{metric.label}</Text>
                <Text style={[styles.heading, { marginTop: 6 }]}>{metric.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.buttonSecondary, { marginTop: 16 }]}
            onPress={() => navigation.navigate('ConnectAccounts')}
          >
            <Text style={[styles.buttonOutlineText, { color: theme.primary }]}>Invite collaborator</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionHeader}>All insights</Text>
          <View style={[styles.card, { backgroundColor: theme.cardSoft }]}> 
            <Text style={styles.body}>Audience match is highest with creators talking about sustainability. Queue two collabs this week.</Text>
            <TouchableOpacity style={{ marginTop: 12 }} onPress={() => navigation.navigate('Analytics')}>
              <Text style={{ color: theme.primary, fontWeight: '600' }}>Open analytics →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionHeader}>Trending for you</Text>
          {trends.map((trend, idx) => (
            <TrendCard
              key={trend.id || idx}
              theme={theme}
              trend={trend}
              score={9 - idx}
              onPress={() => navigation.navigate('Generate', { selectedTrend: trend })}
            />
          ))}
        </View>

        <View style={{ marginTop: 24 }}>
          <PostGrid theme={theme} posts={posts} />
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionHeader}>Next steps</Text>
          <View style={localStyles.quickRow}>
            <TouchableOpacity
              style={[styles.card, localStyles.quickCard]}
              onPress={() => navigation.navigate('Generate')}
            >
              <Text style={[styles.caption, { textTransform: 'uppercase' }]}>Generation</Text>
              <Text style={[styles.heading, { marginTop: 6 }]}>Draft fresh post</Text>
              <Text style={[styles.body, { color: theme.textMuted }]}>Blend latest trend with your tone in 20 seconds.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.card, localStyles.quickCard]}
              onPress={() => navigation.navigate('Analytics', { brandId: brand?._id })}
            >
              <Text style={[styles.caption, { textTransform: 'uppercase' }]}>Insights</Text>
              <Text style={[styles.heading, { marginTop: 6 }]}>Review ROI</Text>
              <Text style={[styles.body, { color: theme.textMuted }]}>Meta + Google spend vs organic lift.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <FAB theme={theme} onPress={() => navigation.navigate('Generate')} icon="✦" />
      <BottomNav
        theme={theme}
        active="Dashboard"
        navigation={navigation}
        routes={{ Dashboard: {}, Generate: {}, Analytics: {}, ConnectAccounts: {} }}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
  },
  metricTile: {
    width: '50%',
    marginBottom: 16,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    borderRadius: 24,
  },
});
