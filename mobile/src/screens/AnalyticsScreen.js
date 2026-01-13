import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { themeStyles } from '../theme/colors';
import BottomNav from '../components/BottomNav';
import { useApp } from '../context/AppContext';

export default function AnalyticsScreen({ navigation }) {
  const { api, token, brand, theme } = useApp();
  const brandId = brand?._id;
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const styles = themeStyles(theme);

  useEffect(() => {
    if (brandId) load();
  }, [brandId]);

  async function load() {
    try {
      const res = await api.get(`/api/v1/analytics/${brandId}`, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (e) {}
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const platformStats = data?.byPlatform || [];
  const totalLikes = platformStats.reduce((sum, p) => sum + (p.sumLikes || 0), 0);
  const totalComments = platformStats.reduce((sum, p) => sum + (p.sumComments || 0), 0);

  return (
    <View style={[styles.screen, { paddingHorizontal: 0 }]}> 
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingHorizontal: 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Performance pulse</Text>
        <Text style={styles.subtitle}>Direct tie-in to the RL + engagement loops documented in MOBILE_UI_IMPROVEMENTS.</Text>

        <View style={localStyles.metricsRow}>
          <View style={[styles.metricCard, localStyles.metricTile]}>
            <Text style={styles.caption}>Total posts</Text>
            <Text style={[styles.heading, localStyles.bigNumber]}>{data?.total || 0}</Text>
            <Text style={[styles.caption, { color: theme.primary }]}>↑ 12% vs last sprint</Text>
          </View>
          <View style={[styles.metricCard, localStyles.metricTile]}>
            <Text style={styles.caption}>Published</Text>
            <Text style={[styles.heading, localStyles.bigNumber]}>{data?.published || 0}</Text>
            <Text style={[styles.caption, { color: theme.primary }]}>Auto-approved</Text>
          </View>
        </View>

        <View style={localStyles.metricsRow}>
          <View style={[styles.metricCard, localStyles.metricTile]}>
            <Text style={styles.caption}>Likes</Text>
            <Text style={[styles.heading, { fontSize: 24 }]}>{totalLikes.toLocaleString()}</Text>
          </View>
          <View style={[styles.metricCard, localStyles.metricTile]}>
            <Text style={styles.caption}>Comments</Text>
            <Text style={[styles.heading, { fontSize: 24 }]}>{totalComments.toLocaleString()}</Text>
          </View>
        </View>

        {platformStats.length > 0 && (
          <View style={[styles.card, { marginTop: 24 }]}> 
            <Text style={[styles.heading, { marginBottom: 16 }]}>By platform</Text>
            {platformStats.map((p) => (
              <View key={p._id} style={localStyles.platformRow}>
                <View style={[localStyles.platformIcon, { backgroundColor: getPlatformColor(p._id) }]}>
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>{p._id.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.body, { fontWeight: '600', textTransform: 'capitalize' }]}>{p._id}</Text>
                  <Text style={styles.caption}>Avg reward {Number(p.avgReward || 0).toFixed(2)}</Text>
                </View>
                <Text style={[styles.body, { fontWeight: '600' }]}>{(p.sumLikes || 0).toLocaleString()} ❤</Text>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.card, { marginTop: 24, backgroundColor: theme.cardSoft }]}> 
          <Text style={styles.heading}>AI takeaways</Text>
          <Text style={[styles.body, { marginTop: 8, color: theme.textMuted }]}>Weekday mornings (09:00-11:00) continue to outperform, and Meta Ads escalate ROI when paired with sustainability keywords.</Text>
        </View>
      </ScrollView>

      <BottomNav
        theme={theme}
        active="Analytics"
        navigation={navigation}
        routes={{ Dashboard: {}, Generate: {}, Analytics: {}, ConnectAccounts: {} }}
      />
    </View>
  );
}

function getPlatformColor(platform) {
  const colors = { twitter: '#1DA1F2', linkedin: '#0A66C2', facebook: '#1877F2', instagram: '#E4405F' };
  return colors[platform] || '#7C8DB5';
}

const localStyles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 12,
  },
  metricTile: {
    flex: 1,
    borderRadius: 24,
  },
  bigNumber: {
    fontSize: 30,
    marginVertical: 6,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EAF2',
  },
  platformIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
});
