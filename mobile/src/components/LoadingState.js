import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { themeStyles } from '../theme/colors';

export default function LoadingState({ theme, message = 'Loading...', messages = [] }) {
  const styles = themeStyles(theme);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [currentMessage, setCurrentMessage] = React.useState(messages[0] || message);
  const [messageIndex, setMessageIndex] = React.useState(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 600, useNativeDriver: true }),
        ]),
      ])
    ).start();

    if (messages.length > 0) {
      const interval = setInterval(() => {
        setMessageIndex((prev) => {
          const next = (prev + 1) % messages.length;
          setCurrentMessage(messages[next]);
          return next;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [messages]);

  return (
    <View style={localStyles.container}>
      <Animated.View style={[localStyles.spinner, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={[localStyles.dot, { backgroundColor: theme.primary }]} />
        <View style={[localStyles.dot, { backgroundColor: theme.secondary, marginLeft: 8 }]} />
        <View style={[localStyles.dot, { backgroundColor: theme.glow, marginLeft: 8 }]} />
      </Animated.View>
      <Text style={[styles.subtitle, { marginTop: 16, textAlign: 'center' }]}>{currentMessage}</Text>
    </View>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  spinner: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
