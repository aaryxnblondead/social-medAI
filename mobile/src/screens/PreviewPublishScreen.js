import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function PreviewPublishScreen({ navigation, route }) {
  const { api, token, brand } = useApp();
  const { draft } = route.params || {};
  const [connections, setConnections] = useState({});
  const [editedCopy, setEditedCopy] = useState(draft?.content?.copy || '');
  const [publishing, setPublishing] = useState(false);
  const styles = themeStyles(lightTheme);

  useEffect(() => { loadConnections(); }, []);

  async function loadConnections() {
    try {
      const res = await api.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` }});
      setConnections(res.data?.user?.socialAccounts || {});
    } catch {}
  }

  async function publish(platform) {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await api.post(`/api/v1/posts/${draft._id}/publish`, { platform }, { headers: { Authorization: `Bearer ${token}` }});
      alert(`Published to ${platform}! 🎉\n${res.data.post?.platformUrl || res.data.post?.platformPostId}`);
      navigation.navigate('Analytics');
    } catch (e) { 
      alert('Publish failed: ' + (e.response?.data?.error || e.message)); 
    } finally { 
      setPublishing(false); 
    }
  }

  const platformButtons = [
    { name: 'Twitter', key: 'twitter', color: lightTheme.primary },
    { name: 'LinkedIn', key: 'linkedin', color: lightTheme.secondary },
    { name: 'Facebook', key: 'facebook', color: '#1877F2' },
    { name: 'Instagram', key: 'instagram', color: '#E4405F' },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Review & Publish</Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {connections?.twitter?.connected && <View style={styles.badge}><Text style={styles.badgeText}>Twitter ✓</Text></View>}
          {connections?.linkedin?.connected && <View style={styles.badge}><Text style={styles.badgeText}>LinkedIn ✓</Text></View>}
          {connections?.facebook?.connected && <View style={styles.badge}><Text style={styles.badgeText}>Facebook ✓</Text></View>}
          {connections?.instagram?.connected && <View style={styles.badge}><Text style={styles.badgeText}>Instagram ✓</Text></View>}
        </View>

        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={[styles.heading, { marginBottom: 12 }]}>Post Content</Text>
          <TextInput
            style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]}
            multiline
            value={editedCopy}
            onChangeText={setEditedCopy}
            placeholder="Your post content..."
          />
          
          {draft?.content?.graphicUrl && (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.heading, { marginBottom: 8 }]}>Generated Graphic</Text>
              <Image 
                source={{ uri: draft.content.graphicUrl }} 
                style={localStyles.previewImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={[styles.heading, { marginBottom: 12 }]}>Social Media Preview</Text>
          <View style={localStyles.mockup}>
            <View style={localStyles.mockupHeader}>
              <View style={localStyles.avatar} />
              <View>
                <Text style={[styles.body, { fontWeight: '600' }]}>Your Brand</Text>
                <Text style={styles.caption}>Just now</Text>
              </View>
            </View>
            <Text style={[styles.body, { marginTop: 12 }]}>{editedCopy}</Text>
            {draft?.content?.graphicUrl && (
              <Image source={{ uri: draft.content.graphicUrl }} style={localStyles.mockupImage} />
            )}
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <Text style={[styles.heading, { marginBottom: 12 }]}>Publish to:</Text>
          {platformButtons.map((platform) => (
            <TouchableOpacity
              key={platform.key}
              style={[styles.buttonPrimary, { backgroundColor: platform.color, marginBottom: 10 }]}
              onPress={() => publish(platform.key)}
              disabled={publishing || !connections?.[platform.key]?.connected}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>
                {publishing ? 'Publishing...' : `Publish to ${platform.name}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  previewImage: { width: '100%', height: 200, borderRadius: 12 },
  mockup: { backgroundColor: '#F8F9FA', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8E9ED' },
  mockupHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C5CE7', marginRight: 12 },
  mockupImage: { width: '100%', height: 150, borderRadius: 8, marginTop: 12 },
});
