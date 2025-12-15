import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';
import TrendCard from '../components/TrendCard';
import LoadingState from '../components/LoadingState';
import BottomNav from '../components/BottomNav';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';

export default function GenerateScreen({ navigation, route }) {
  const { api, token, brand } = useApp();
  const { selectedTrend } = route.params || {};
  const [trends, setTrends] = useState([]);
  const [connections, setConnections] = useState({});
  const [category, setCategory] = useState('technology');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const styles = themeStyles(lightTheme);

  useEffect(() => { loadTrends(); }, [category]);
  useEffect(() => { loadConnections(); }, []);
  useEffect(() => { if (selectedTrend) generate(selectedTrend); }, [selectedTrend]);

  async function loadTrends() {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/trends?category=${encodeURIComponent(category)}`, { headers: { Authorization: `Bearer ${token}` }});
      setTrends(res.data.items || []);
    } catch (e) { console.log('Trends error:', e.message); }
    finally { setLoading(false); }
  }

  async function loadConnections() {
    try {
      const res = await api.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` }});
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
      const res = await api.post('/api/v1/posts/generate', { brandId: brand?._id, platform: 'twitter', trendId: trend?.id || null }, { headers: { Authorization: `Bearer ${token}` }});
      navigation.navigate('PreviewPublish', { draft: res.data });
    } catch (e) { alert('Generate failed: ' + (e.response?.data?.error || e.message)); }
    finally { setGenerating(false); }
  }

  if (generating) {
    return <LoadingState theme={lightTheme} messages={['Analyzing trend...', 'Crafting copy...', 'Generating graphics...', 'Almost there...']} />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={lightTheme.primary} />}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {connections?.twitter?.connected && <View style={styles.badge}><Text style={styles.badgeText}>Twitter ✓</Text></View>}
          {connections?.linkedin?.connected && <View style={styles.badge}><Text style={styles.badgeText}>LinkedIn ✓</Text></View>}
          {connections?.facebook?.connected && <View style={styles.badge}><Text style={styles.badgeText}>Facebook ✓</Text></View>}
          {connections?.instagram?.connected && <View style={styles.badge}><Text style={styles.badgeText}>Instagram ✓</Text></View>}
        </View>
        
        <Text style={styles.title}>Trending Content</Text>
        <Text style={styles.subtitle}>Tap any trend to generate AI-powered posts</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 20 }}>
          <TouchableOpacity 
            onPress={() => setCategory('technology')} 
            style={[styles.buttonOutline, category === 'technology' && { backgroundColor: lightTheme.primary, borderColor: lightTheme.primary }]}
          >
            <Text style={[styles.buttonOutlineText, category === 'technology' && { color: '#ffffff' }]}>Technology</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setCategory('business')} 
            style={[styles.buttonOutline, category === 'business' && { backgroundColor: lightTheme.primary, borderColor: lightTheme.primary }]}
          >
            <Text style={[styles.buttonOutlineText, category === 'business' && { color: '#ffffff' }]}>Business</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingState theme={lightTheme} message="Loading trends..." />
        ) : trends.length === 0 ? (
          <EmptyState 
            icon="🔍"
            title="No Trends Found"
            message="Try selecting a different category or refresh to see the latest trends."
            buttonText="Refresh"
            onPress={onRefresh}
          />
        ) : (
          trends.map((trend, idx) => (
            <TrendCard 
              key={idx} 
              theme={lightTheme} 
              trend={trend} 
              score={9 - idx}
              onPress={() => generate(trend)}
            />
          ))
        )}
      </ScrollView>
      
      <BottomNav 
        active="Generate" 
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
