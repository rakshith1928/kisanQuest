import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LANGUAGES = [
  { id: 'hi', name: 'हिंदी' },
  { id: 'en', name: 'English' },
  { id: 'mr', name: 'मराठी' },
];

export default function OnboardingScreen({ navigation }: any) {
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  const handleSpeak = () => {
    // Voice prompt placeholder
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroSection}>
          <View style={styles.farmerImagePlaceholder} />
        </View>
        <View style={styles.contentCard}>
          <Text style={styles.title}>Choose Your Language</Text>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[styles.langCard, selectedLang === lang.id && styles.langCardSelected]}
              onPress={() => setSelectedLang(lang.id)}
            >
              <Text style={[styles.langText, selectedLang === lang.id && styles.langTextSelected]}>{lang.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.micButton} onPress={handleSpeak}>
            <Text style={styles.micButtonText}>Tap to Speak</Text>
            <Text style={styles.micTooltip}>Say your choice</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff8ff' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  heroSection: { height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  farmerImagePlaceholder: { width: 120, height: 120, backgroundColor: '#9df197', borderRadius: 60 },
  contentCard: { backgroundColor: '#f6cfc2', borderRadius: 32, padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#233039', marginBottom: 24, textAlign: 'center' },
  langCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#176a21', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
  langCardSelected: { backgroundColor: '#9df197' },
  langText: { fontSize: 18, fontWeight: '600', color: '#4f5d67', textAlign: 'center' },
  langTextSelected: { color: '#005c15' },
  micButton: { backgroundColor: '#176a21', borderRadius: 999, paddingVertical: 20, paddingHorizontal: 32, alignItems: 'center', marginTop: 16, elevation: 6 },
  micButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  micTooltip: { color: '#d1ffc8', fontSize: 12, marginTop: 4 }
});
