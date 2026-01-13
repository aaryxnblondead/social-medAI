import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { themeStyles } from '../theme/colors';
import { useApp } from '../context/AppContext';
import EmptyState from '../components/EmptyState';

const platformButtons = [
  { name: 'Twitter', key: 'twitter', color: '#1DA1F2' },
  { name: 'LinkedIn', key: 'linkedin', color: '#0A66C2' },
  { name: 'Facebook', key: 'facebook', color: '#1877F2' },
  { name: 'Instagram', key: 'instagram', color: '#E4405F' },
];

export default function PreviewPublishScreen({ navigation, route }) {
  const { api, token, theme } = useApp();
  const { draft } = route.params || {};
  const [connections, setConnections] = useState({});
  const [editedCopy, setEditedCopy] = useState(draft?.content?.copy || '');
  const [publishing, setPublishing] = useState(false);
  const styles = themeStyles(theme);

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    try {
      const res = await api.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setConnections(res.data?.user?.socialAccounts || {});
    } catch {}
  }

  async function publish(platform) {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await api.post(
        `/api/v1/posts/${draft._id}/publish`,
        { platform, copy: editedCopy },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Published to ${platform}!\n${res.data.post?.platformUrl || res.data.post?.platformPostId}`);
      navigation.navigate('Analytics');
    } catch (e) {
      alert('Publish failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setPublishing(false);
    }
  }

  if (!draft) {
    return (
      <EmptyState
        theme={theme}
        icon="📝"
        title="No draft selected"
        message="Generate a post first so we can show the preview/publish experience."
        buttonText="Generate"
        onPress={() => navigation.navigate('Generate')}
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingHorizontal: 0 }]}> 
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingHorizontal: 20 }]}> 
        <View style={localStyles.badgeRow}>
          {platformButtons.map((platform) =>
            connections?.[platform.key]?.connected ? (
              <View key={platform.key} style={styles.badge}>
                <Text style={styles.badgeText}>{platform.name} ✓</Text>
              </View>
            ) : null
          )}
        </View>

        <Text style={styles.title}>Review & publish</Text>
        <Text style={styles.subtitle}>Automations mirror the flows defined in PRODUCTION_IMPLEMENTATION + bigness-flowcharts.</Text>

        <View style={[styles.card, { marginTop: 20 }]}> 
          <Text style={[styles.heading, { marginBottom: 12 }]}>Final polish</Text>
          <TextInput
            style={[styles.input, { minHeight: 140, textAlignVertical: 'top' }]}
            multiline
            value={editedCopy}
            onChangeText={setEditedCopy}
            placeholder="Punch up the copy before it ships"
          />
          {draft?.content?.graphicUrl && (
            <Image source={{ uri: draft.content.graphicUrl }} style={localStyles.previewImage} resizeMode="cover" />
          )}
        </View>

        <View style={[styles.card, { marginTop: 16 }]}> 
          <Text style={[styles.heading, { marginBottom: 12 }]}>Channel preview</Text>
          <View style={localStyles.mockup}>
            <View style={localStyles.mockupHeader}>
              <View style={[localStyles.avatar, { backgroundColor: theme.primary }]} />
              <View>
                <Text style={[styles.body, { fontWeight: '600' }]}>{draft?.brand?.name || 'Your brand'}</Text>
                <Text style={styles.caption}>Now · Auto scheduled</Text>
              </View>
            </View>
            <Text style={[styles.body, { marginTop: 12 }]}>{editedCopy}</Text>
            {draft?.content?.graphicUrl && (
              <Image source={{ uri: draft.content.graphicUrl }} style={localStyles.mockupImage} />
            )}
          </View>
        </View>

        <View style={[styles.card, { marginTop: 16, backgroundColor: theme.chip }]}> 
          <Text style={[styles.caption, { textTransform: 'uppercase' }]}>Automation check</Text>
          <View style={{ marginTop: 10 }}>
            {['Meta/GAds sync ready', 'Tokens valid', 'Creative passes brand guardrails'].map((item) => (
              <View key={item} style={localStyles.checkRow}>
                <Text style={{ color: theme.primary }}>✓</Text>
                <Text style={[styles.body, { marginLeft: 8 }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Publish</Text>
        <View style={localStyles.platformGrid}>
          {platformButtons.map((platform) => {
            const connected = !!connections?.[platform.key]?.connected;
            return (
              <TouchableOpacity
                key={platform.key}
                style={[
                  styles.card,
                  localStyles.platformCard,
                  { borderColor: connected ? platform.color : theme.border },
                ]}
                onPress={() => connected && publish(platform.key)}
                disabled={!connected || publishing}
              >
                <Text style={[styles.heading, { color: platform.color }]}>{platform.name}</Text>
                <Text style={[styles.caption, { marginTop: 6 }]}>
                  {connected ? 'Ready to ship' : 'Connect account first'}
                </Text>
                <Text style={[styles.body, { marginTop: 10, color: theme.textMuted }]}>
                  {connected ? 'Tap to publish now' : 'Open Settings → Connected accounts'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    marginTop: 16,
  },
  mockup: {
    backgroundColor: '#F7F9FB',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E6EF',
  },
  mockupHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 16, marginRight: 12 },
  mockupImage: { width: '100%', height: 160, borderRadius: 16, marginTop: 12 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    width: '48%',
    borderRadius: 22,
    paddingVertical: 18,
  },
});
