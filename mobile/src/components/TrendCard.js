import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { lightTheme } from '../theme/colors';

export default function TrendCard({ theme = lightTheme, trend, onPress, score }) {
  const growth = trend?.metrics?.growth || `${Math.floor(Math.random() * 12) + 3}%`;
  const volume = trend?.metrics?.volume || `${Math.floor(Math.random() * 500) + 200} mentions`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.92}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          shadowColor: theme.shadow,
          borderColor: theme.softShadow,
        },
      ]}
    >
      <View style={styles.thumbnailWrap}>
        <Image
          source={{ uri: trend.imageUrl || 'https://picsum.photos/400/300' }}
          resizeMode="cover"
          style={styles.thumbnail}
        />
        {score && (
          <View style={[styles.pill, { backgroundColor: theme.chip }]}> 
            <Text style={[styles.pillText, { color: theme.accent }]}>score {score}/10</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={[styles.category, { color: theme.textMuted }]}>
          {trend.category || 'Priority Trend'}
        </Text>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {trend.title}
        </Text>
        <Text style={[styles.description, { color: theme.textMuted }]} numberOfLines={2}>
          {trend.description || 'Tap to generate ready-to-publish copy'}
        </Text>
        <View style={styles.metaRow}>
          <View>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>24h Growth</Text>
            <Text style={[styles.metaValue, { color: theme.primary }]}>{growth}</Text>
          </View>
          <View>
            <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Volume</Text>
            <Text style={[styles.metaValue, { color: theme.text }]}>{volume}</Text>
          </View>
        </View>
      </View>
      <View style={[styles.cta, { backgroundColor: theme.chip }]}> 
        <Text style={{ color: theme.accent, fontWeight: '600' }}>Generate insight →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    borderWidth: 1,
  },
  thumbnailWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginRight: 16,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    marginBottom: 16,
  },
  category: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 6,
  },
  description: {
    fontSize: 14,
    marginTop: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  metaLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  cta: {
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
