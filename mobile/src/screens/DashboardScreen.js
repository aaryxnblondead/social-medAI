import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';
import TrendCard from '../components/TrendCard';
import PostGrid from '../components/PostGrid';
import FAB from '../components/FAB';
import BottomNav from '../components/BottomNav';
import { useApp } from '../context/AppContext';

export default function DashboardScreen({ navigation }) {
  const { api, token, brand } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [trends, setTrends] = useState([]);
  const [posts, setPosts] = useState([]);
  const styles = themeStyles(lightTheme);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const trendsRes = await api.get('/api/v1/trends?category=technology', { headers: { Authorization: `Bearer ${token}` }});
      setTrends((trendsRes.data.items || []).slice(0, 5));
      
      const postsRes = await api.get(`/api/v1/analytics/${brand?._id}`, { headers: { Authorization: `Bearer ${token}` }});
      setPosts(Array(7).fill(null).map((_, i) => i < (postsRes.data?.published || 0) ? { status: 'published' } : null));
    } catch (e) {
      console.log('Dashboard load error:', e.message);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  function navigateToGenerate(trend) {
    navigation.navigate('Generate', { selectedTrend: trend });
  }

  return (
    <View style={styles.screen}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={lightTheme.primary} />}
      >
        <View style={localStyles.header}>
          <View>
            <Text style={styles.title}>{brand?.name || 'Dashboard'}</Text>
            <Text style={styles.subtitle}>AI-Powered Content Generation</Text>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.heading, { marginBottom: 12 }]}>🔥 Trending for You</Text>
          {trends.map((trend, idx) => (
            <TrendCard 
              key={idx} 
              theme={lightTheme} 
              trend={trend} 
              score={9 - idx} 
              onPress={() => navigateToGenerate(trend)}
            />
          ))}
        </View>

        <View style={{ marginTop: 24 }}>
          <PostGrid theme={lightTheme} posts={posts} />
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.heading, { marginBottom: 12 }]}>⚡ Quick Actions</Text>
          <TouchableOpacity 
            style={styles.buttonPrimary} 
            onPress={() => navigation.navigate('Generate')}
          >
            <Text style={styles.buttonText}>Generate from Trend</Text>
          </TouchableOpacity>
          <View style={{ height: 12 }} />
          <TouchableOpacity 
            style={styles.buttonSecondary} 
            onPress={() => navigation.navigate('Analytics', { brandId: brand?._id })}
          >
            <Text style={styles.buttonText}>View Analytics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <FAB onPress={() => navigation.navigate('Generate')} />
      <BottomNav 
        active="Dashboard" 
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
});
