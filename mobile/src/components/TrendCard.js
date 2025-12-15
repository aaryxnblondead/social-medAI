import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { themeStyles } from '../theme/colors';

export default function TrendCard({ theme, trend, onPress, score }) {
  const styles = themeStyles(theme);
  
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.trendCard}>
      <Image 
        source={{ uri: trend.imageUrl || 'https://picsum.photos/400/300' }} 
        style={localStyles.image}
        resizeMode="cover"
      />
      <View style={localStyles.overlay} />
      <View style={localStyles.content}>
        {score && (
          <View style={[styles.badge, localStyles.scoreBadge]}>
            <Text style={styles.badgeText}>🔥 {score}</Text>
          </View>
        )}
        <Text style={[styles.heading, { color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]} numberOfLines={2}>
          {trend.title}
        </Text>
        <Text style={[styles.body, { color: '#ffffff', marginTop: 8, opacity: 0.9 }]} numberOfLines={2}>
          {trend.description || 'Tap to generate content'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const localStyles = StyleSheet.create({
  image: { width: '100%', height: 220, borderRadius: 20 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20 },
  content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  scoreBadge: { position: 'absolute', top: -40, right: 20, alignSelf: 'flex-end' },
});
