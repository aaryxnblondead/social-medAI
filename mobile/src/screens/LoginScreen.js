import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { api, setToken, setUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const styles = themeStyles(lightTheme);

  async function login() {
    try {
      const res = await api.post('/api/v1/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      navigation.replace('Onboarding');
    } catch (e) {
      alert('Login failed: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Welcome</Text>
      <View style={{ height: 12 }} />
      <View style={styles.card}>
        <Text style={styles.subtitle}>Sign in</Text>
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={{ borderWidth: 1, borderColor: lightTheme.border, padding: 10, borderRadius: 8, marginTop: 8 }} />
        <TextInput placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} style={{ borderWidth: 1, borderColor: lightTheme.border, padding: 10, borderRadius: 8, marginTop: 8 }} />
        <View style={{ height: 12 }} />
        <TouchableOpacity onPress={login} style={styles.buttonPrimary}><Text style={styles.buttonText}>Login</Text></TouchableOpacity>
        <View style={{ height: 8 }} />
        <TouchableOpacity onPress={async () => {
          try {
            const res = await api.post('/api/v1/auth/register', { email: email || 'test@example.com', password: password || 'secret123' });
            setToken(res.data.token);
            setUser(res.data.user);
            navigation.replace('Onboarding');
          } catch (e) { alert('Register failed: ' + (e.response?.data?.error || e.message)); }
        }} style={styles.buttonOutline}><Text style={{ color: lightTheme.text, textAlign: 'center', fontWeight: '600' }}>Register</Text></TouchableOpacity>
      </View>
    </View>
  );
}
