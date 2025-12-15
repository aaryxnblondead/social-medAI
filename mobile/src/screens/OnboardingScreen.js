import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { themeStyles, lightTheme } from '../theme/colors';
import { useApp } from '../context/AppContext';

export default function OnboardingScreen({ navigation }) {
  const { api, token, setBrand } = useApp();
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('technology');
  const [step, setStep] = useState(1);
  const styles = themeStyles(lightTheme);

  const industries = [
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛒' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  ];

  async function onboard() {
    if (!name.trim()) {
      alert('Please enter your brand name');
      return;
    }
    try {
      const payload = { 
        name, 
        industry, 
        colors: [lightTheme.primary], 
        tone: 'professional', 
        pillars: ['innovation','quality'], 
        audience: 'B2B marketers', 
        preferences: { frequency: 3, bestTimes: ['09:00','13:00'] } 
      };
      const res = await api.post('/api/v1/brands/onboard', payload, { headers: { Authorization: `Bearer ${token}` }});
      setBrand(res.data.brand);
      navigation.navigate('Dashboard');
    } catch (e) { 
      alert('Onboarding failed: ' + (e.response?.data?.error || e.message)); 
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
        <View style={localStyles.progressBar}>
          <View style={[localStyles.progressFill, { width: `${(step / 2) * 100}%` }]} />
        </View>

        <Text style={[styles.title, { marginTop: 24, textAlign: 'center' }]}>
          {step === 1 ? 'Welcome to Bigness ✨' : 'Choose Your Industry'}
        </Text>
        <Text style={[styles.body, { textAlign: 'center', marginTop: 8, color: lightTheme.textSecondary }]}>
          {step === 1 ? 'Let\'s set up your brand profile' : 'Help us personalize your experience'}
        </Text>

        {step === 1 && (
          <View style={{ marginTop: 32 }}>
            <View style={styles.card}>
              <Text style={[styles.heading, { marginBottom: 8 }]}>Brand Name</Text>
              <TextInput 
                placeholder="Enter your brand name" 
                value={name} 
                onChangeText={setName}
                style={[styles.input, { fontSize: 16 }]}
                autoFocus
              />
            </View>

            <TouchableOpacity 
              onPress={() => setStep(2)} 
              style={[styles.buttonPrimary, { marginTop: 24 }]}
              disabled={!name.trim()}
            >
              <Text style={styles.buttonText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={{ marginTop: 32 }}>
            <View style={localStyles.industryGrid}>
              {industries.map((ind) => (
                <TouchableOpacity
                  key={ind.id}
                  style={[
                    localStyles.industryCard,
                    industry === ind.id && { 
                      backgroundColor: lightTheme.primary + '15',
                      borderColor: lightTheme.primary,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => setIndustry(ind.id)}
                  activeOpacity={0.8}
                >
                  <Text style={localStyles.industryIcon}>{ind.icon}</Text>
                  <Text style={[styles.body, { fontWeight: '600', marginTop: 8 }]}>{ind.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <TouchableOpacity 
                onPress={() => setStep(1)} 
                style={[styles.buttonOutline, { flex: 1 }]}
              >
                <Text style={styles.buttonOutlineText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={onboard} 
                style={[styles.buttonPrimary, { flex: 2 }]}
              >
                <Text style={styles.buttonText}>Get Started 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  progressBar: {
    height: 4,
    backgroundColor: '#E8E9ED',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: lightTheme.primary,
  },
  industryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  industryCard: {
    width: '47%',
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E9ED',
    alignItems: 'center',
  },
  industryIcon: {
    fontSize: 40,
  },
});
