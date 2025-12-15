import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';
import BottomNav from '../components/BottomNav';
import { useApp } from '../context/AppContext';

export default function AnalyticsScreen({ navigation }) {
  const { api, token, brand } = useApp();
  const brandId = brand?._id;
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const styles = themeStyles(lightTheme);

  useEffect(() => { load(); }, [brandId]);

  async function load() {
    try {
      const res = await api.get(`/api/v1/analytics/${brandId}`, { headers: { Authorization: `Bearer ${token}` }});
      setData(res.data);
    } catch (e) {}
  }

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const totalLikes = (data?.byPlatform || []).reduce((sum, p) => sum + (p.sumLikes || 0), 0);
  const totalComments = (data?.byPlatform || []).reduce((sum, p) => sum + (p.sumComments || 0), 0);
  const totalShares = (data?.byPlatform || []).reduce((sum, p) => sum + (p.sumShares || 0), 0);

  return (
    <View style={styles.screen}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Analytics</Text>

        <View style={localStyles.metricsRow}>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <Text style={styles.caption}>Total Posts</Text>
            <Text style={[styles.heading, { fontSize: 28, marginTop: 4 }]}>{data?.total || 0}</Text>
            <Text style={[styles.caption, { color: lightTheme.success, marginTop: 4 }]}>↑ 12%</Text>
          </View>
          <View style={[styles.metricCard, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.caption}>Published</Text>
            <Text style={[styles.heading, { fontSize: 28, marginTop: 4 }]}>{data?.published || 0}</Text>
            <Text style={[styles.caption, { color: lightTheme.success, marginTop: 4 }]}>↑ 8%</Text>
          </View>
        </View>

        <View style={localStyles.metricsRow}>
          <View style={[styles.metricCard, { flex: 1 }]}>
            <Text style={styles.caption}>Total Likes</Text>
            <Text style={[styles.heading, { fontSize: 24, marginTop: 4 }]}>{totalLikes.toLocaleString()}</Text>
          </View>
          <View style={[styles.metricCard, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.caption}>Comments</Text>
            <Text style={[styles.heading, { fontSize: 24, marginTop: 4 }]}>{totalComments.toLocaleString()}</Text>
          </View>
        </View>

        {(data?.byPlatform || []).length > 0 && (
          <View style={[styles.card, { marginTop: 20 }]}>
            <Text style={[styles.heading, { marginBottom: 16 }]}>By Platform</Text>
            {data.byPlatform.map(p => (
              <View key={p._id} style={localStyles.platformRow}>
                <View style={[localStyles.platformIcon, { backgroundColor: getPlatformColor(p._id) }]}>
                  <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>
                    {p._id.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.body, { fontWeight: '600', textTransform: 'capitalize' }]}>{p._id}</Text>
                  <Text style={styles.caption}>Avg Reward: {Number(p.avgReward || 0).toFixed(2)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.body}>{(p.sumLikes || 0).toLocaleString()}</Text>
                  <Text style={styles.caption}>likes</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.card, { marginTop: 20, backgroundColor: lightTheme.secondary + '15' }]}>
          <Text style={[styles.heading, { marginBottom: 8 }]}>💡 AI Insights</Text>
          <Text style={styles.body}>Your posts perform best on weekday mornings. Consider scheduling content between 9-11 AM for maximum engagement.</Text>
        </View>
      </ScrollView>
      
      <BottomNav 
        active="Analytics" 
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

function getPlatformColor(platform) {
  const colors = { twitter: '#1DA1F2', linkedin: '#0A66C2', facebook: '#1877F2', instagram: '#E4405F' };
  return colors[platform] || lightTheme.primary;
}

const localStyles = StyleSheet.create({
  metricsRow: { flexDirection: 'row', marginTop: 16 },
  platformRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8E9ED' },
  platformIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
});
