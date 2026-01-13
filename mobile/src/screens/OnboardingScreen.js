import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { themeStyles } from '../theme/colors';
import { useApp } from '../context/AppContext';

const personas = [
  {
    id: 'brand',
    title: 'Brand Team',
    subtitle: 'Plan → Generate → Publish',
    meta: 'Strategy, approvals, paid media',
  },
  {
    id: 'influencer',
    title: 'Creator / Influencer',
    subtitle: 'Pitch → Collaborate → Earn',
    meta: 'Collabs, inbox, ROI proof',
  },
];

const industries = [
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'consumer', name: 'Consumer', icon: '🛍️' },
  { id: 'wellness', name: 'Wellness', icon: '🧘' },
  { id: 'finance', name: 'Finance', icon: '💰' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'food', name: 'Food', icon: '🍜' },
];

const objectives = ['Launch campaign', 'Always-on', 'Product drop', 'Community boost'];

export default function OnboardingScreen({ navigation }) {
  const { api, token, setBrand, theme } = useApp();
  const styles = themeStyles(theme);
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState('brand');
  const [name, setName] = useState('Lena Studio');
  const [industry, setIndustry] = useState('technology');
  const [objective, setObjective] = useState('Launch campaign');
  const [loading, setLoading] = useState(false);

  const progress = useMemo(() => (step === 1 ? 0.5 : 1), [step]);

  async function onboard() {
    if (!name.trim()) {
      alert('Tell us who we are helping.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name,
        industry,
        persona,
        objective,
        colors: [theme.primary],
        tone: persona === 'brand' ? 'professional' : 'personal',
        pillars: persona === 'brand' ? ['innovation', 'trust'] : ['authenticity', 'insight'],
        audience: persona === 'brand' ? 'Growth marketers' : 'Brand teams',
        preferences: { cadence: persona === 'brand' ? 3 : 2, focus: objective },
      };
      const res = await api.post('/api/v1/brands/onboard', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBrand(res.data.brand);
      navigation.navigate('Dashboard');
    } catch (e) {
      alert('Onboarding failed: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.screen, { paddingHorizontal: 0 }]}> 
      <ScrollView contentContainerStyle={[styles.scrollContainer, localStyles.scrollPad]}>
        <View style={localStyles.progressBar}>
          <View style={[localStyles.progressFill, { backgroundColor: theme.primary, width: `${progress * 100}%` }]} />
        </View>

        <Text style={[styles.title, { textAlign: 'center', marginTop: 24 }]}>
          {step === 1 ? 'Who are we setting up?' : 'Tailor your workspace'}
        </Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>Based on your selection we preload the right journeys from the architecture doc.</Text>

        {step === 1 && (
          <View style={{ marginTop: 28 }}>
            {personas.map((option) => {
              const active = persona === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.card,
                    localStyles.personaCard,
                    active && { borderColor: theme.primary, backgroundColor: theme.cardSoft },
                  ]}
                  onPress={() => setPersona(option.id)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.heading, { marginBottom: 4 }]}>{option.title}</Text>
                  <Text style={styles.caption}>{option.subtitle}</Text>
                  <Text style={[styles.body, { marginTop: 8, color: theme.textMuted }]}>{option.meta}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.buttonPrimary, { marginTop: 16 }]}
              onPress={() => setStep(2)}
            >
              <Text style={styles.buttonText}>Next · Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={{ marginTop: 28 }}>
            <View style={[styles.card, { marginBottom: 20 }]}> 
              <Text style={styles.caption}>{persona === 'brand' ? 'Brand name' : 'Creator alias'}</Text>
              <TextInput
                style={[styles.input, { marginTop: 6 }]}
                placeholder={persona === 'brand' ? 'Acme Labs' : '@lenasato'}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.sectionHeader}>Industry focus</Text>
            <View style={localStyles.industryGrid}>
              {industries.map((ind) => {
                const active = industry === ind.id;
                return (
                  <TouchableOpacity
                    key={ind.id}
                    style={[
                      localStyles.industryCard,
                      { borderColor: active ? theme.primary : theme.border },
                      active && { backgroundColor: theme.chip },
                    ]}
                    onPress={() => setIndustry(ind.id)}
                    activeOpacity={0.85}
                  >
                    <Text style={localStyles.industryIcon}>{ind.icon}</Text>
                    <Text style={[styles.body, { fontWeight: '600', marginTop: 6 }]}>{ind.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Primary objective</Text>
            <View style={localStyles.objectiveRow}>
              {objectives.map((obj) => {
                const active = obj === objective;
                return (
                  <TouchableOpacity
                    key={obj}
                    style={[
                      styles.chip,
                      {
                        borderColor: active ? theme.primary : theme.border,
                        backgroundColor: active ? theme.chip : styles.chip.backgroundColor,
                      },
                    ]}
                    onPress={() => setObjective(obj)}
                  >
                    <Text style={[styles.chipText, { color: active ? theme.primary : theme.text }]}>{obj}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 28 }}>
              <TouchableOpacity style={[styles.buttonOutline, { flex: 1 }]} onPress={() => setStep(1)}>
                <Text style={styles.buttonOutlineText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buttonPrimary, { flex: 2 }]}
                onPress={onboard}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? 'Configuring…' : 'Create workspace'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  scrollPad: {
    paddingHorizontal: 24,
    paddingBottom: 160,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#EAEFF5',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  personaCard: {
    marginBottom: 12,
    borderRadius: 24,
  },
  industryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  industryCard: {
    width: '48%',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  industryIcon: {
    fontSize: 36,
  },
  objectiveRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});
