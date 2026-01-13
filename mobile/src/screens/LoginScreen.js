import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { themeStyles } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { api, setToken, setUser, theme } = useApp();
  const [email, setEmail] = useState('demo@bigness.ai');
  const [password, setPassword] = useState('password123');
  const [submitting, setSubmitting] = useState(false);
  const styles = themeStyles(theme);

  async function authenticate(path) {
    try {
      setSubmitting(true);
      const res = await api.post(path, { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      navigation.replace('Onboarding');
    } catch (e) {
      alert((path.includes('register') ? 'Register' : 'Login') + ' failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.screen, localStyles.safeArea, { backgroundColor: theme.background }]}> 
      <KeyboardAvoidingView
        style={localStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={localStyles.hero}>
          <Text style={[localStyles.logo, { color: theme.text }]}>bigness</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>Grow smarter with AI</Text>
        </View>

        <View style={[styles.card, localStyles.formCard, { backgroundColor: theme.card }]}> 
          <Text style={[styles.heading, { textAlign: 'center' }]}>Account access</Text>
          <Text style={[styles.caption, { textAlign: 'center', marginTop: 6 }]}>Use mock credentials or any email/password while in demo mode.</Text>

          <View style={{ marginTop: 20 }}>
            <Text style={styles.caption}>Email</Text>
            <TextInput
              style={[styles.input, { marginTop: 6 }]}
              placeholder="name@company.com"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <View style={{ marginTop: 16 }}>
            <Text style={styles.caption}>Password</Text>
            <TextInput
              style={[styles.input, { marginTop: 6 }]}
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.buttonPrimary, { marginTop: 24 }]}
            onPress={() => authenticate('/api/v1/auth/login')}
            disabled={submitting}
          >
            <Text style={styles.buttonText}>{submitting ? 'Signing in…' : 'Login'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buttonSecondary, { marginTop: 12 }]}
            onPress={() => authenticate('/api/v1/auth/register')}
            disabled={submitting}
          >
            <Text style={[styles.buttonOutlineText, { color: theme.text }]}>Create free workspace</Text>
          </TouchableOpacity>

          <View style={localStyles.divider}>
            <View style={[localStyles.dividerLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.caption, { color: theme.textMuted }]}>or continue with</Text>
            <View style={[localStyles.dividerLine, { backgroundColor: theme.border }]} />
          </View>

          <View style={localStyles.socialRow}>
            {['Google', 'Apple'].map((provider) => (
              <TouchableOpacity key={provider} style={[styles.buttonOutline, localStyles.socialButton]}>
                <Text style={styles.buttonOutlineText}>{provider}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.caption, { textAlign: 'center', marginTop: 12 }]}>No onboarding code required.</Text>
        </View>

        <Text style={[styles.caption, { textAlign: 'center', marginTop: 24 }]}>By continuing you agree to the Bigness terms.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  safeArea: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  flex: { flex: 1, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 36, fontWeight: '700', letterSpacing: 1 },
  formCard: { borderRadius: 28 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1 },
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  socialButton: { flex: 1 },
});
