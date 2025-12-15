import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { themeStyles } from '../theme/colors';

export default function PostGrid({ theme, posts = [] }) {
  const styles = themeStyles(theme);
  
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const postStatusIcons = {
    published: '✓',
    scheduled: '⏰',
    draft: '📝',
    generating: '🚀',
  };

  return (
    <View style={[styles.card, { padding: 20 }]}>
      <Text style={styles.heading}>Posts This Week</Text>
      <View style={localStyles.grid}>
        {weekDays.map((day, idx) => {
          const post = posts[idx];
          const status = post?.status || null;
          const icon = status ? postStatusIcons[status] : '';
          const bgColor = status === 'published' ? theme.success : status ? theme.warning : theme.border;
          
          return (
            <View key={idx} style={localStyles.dayContainer}>
              <View style={[localStyles.dayBox, { backgroundColor: bgColor }]}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
              </View>
              <Text style={[styles.caption, { marginTop: 4, textAlign: 'center' }]}>{day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  dayContainer: { alignItems: 'center' },
  dayBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
