import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const postStatusIcons = {
  published: '✓',
  scheduled: '⏰',
  draft: '📝',
  generating: '⚡',
};

export default function PostGrid({ theme = lightTheme, posts = [] }) {
  const styles = themeStyles(theme);

  return (
    <View style={[styles.card, localStyles.card]}>
      <View style={localStyles.headerRow}>
        <Text style={styles.heading}>Publishing Rhythm</Text>
        <Text style={[styles.caption, { color: theme.textMuted }]}>7-day view</Text>
      </View>
      <View style={localStyles.grid}>
        {weekDays.map((day, idx) => {
          const post = posts[idx];
          const status = post?.status || null;
          const icon = status ? postStatusIcons[status] : '';
          const palette = getPalette(theme, status);

          return (
            <View key={day} style={localStyles.dayContainer}>
              <View style={[localStyles.dayBox, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
              </View>
              <Text style={[styles.caption, { marginTop: 6 }]}>{day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function getPalette(theme, status) {
  if (status === 'published') {
    return { bg: theme.chip, border: theme.accent };
  }
  if (status === 'scheduled') {
    return { bg: theme.backgroundAlt, border: theme.border };
  }
  if (status === 'draft' || status === 'generating') {
    return { bg: theme.cardSoft, border: theme.border };
  }
  return { bg: '#F1F4F9', border: 'transparent' };
}

const localStyles = StyleSheet.create({
  card: {
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
