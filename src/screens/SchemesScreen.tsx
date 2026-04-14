import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image, Linking, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const { width: W } = Dimensions.get('window');

const SCHEME_KEYS = ['pm_kisan', 'pmfby', 'kcc', 'soil_health', 'pm_kmy'];
const SCHEME_EMOJIS: Record<string, string> = {
  pm_kisan: '💰',
  pmfby: '🛡️',
  kcc: '💳',
  soil_health: '🧪',
  pm_kmy: '👴',
};

const SCHEME_URLS: Record<string, string> = {
  pm_kisan: 'https://pmkisan.gov.in/',
  pmfby: 'https://pmfby.gov.in/',
  kcc: 'https://www.myscheme.gov.in/schemes/kcc',
  soil_health: 'https://soilhealth.dac.gov.in/',
  pm_kmy: 'https://maandhan.in/pmkmy',
};

type Props = NativeStackScreenProps<RootStackParamList, 'Schemes'>;

export default function SchemesScreen({ navigation }: Props) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#1B5E20" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{t('ui.schemes.title')}</Text>
          <Text style={styles.subtitle}>{t('ui.schemes.subtitle')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {SCHEME_KEYS.map((key) => (
          <View key={key} style={styles.schemeCard}>
            <LinearGradient colors={['#FFFFFF', '#F1F8E9']} style={styles.cardGradient}>
              <View style={styles.cardHeader}>
                <View style={[styles.emojiCircle, { backgroundColor: getBgColor(key) }]}>
                  <Text style={styles.emoji}>{SCHEME_EMOJIS[key]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.schemeName}>{t(`ui.schemes.list.${key}.name`)}</Text>
                  <Text style={styles.schemeDesc}>{t(`ui.schemes.list.${key}.desc`)}</Text>
                </View>
              </View>
              
              <View style={styles.cardFooter}>
                <TouchableOpacity 
                  style={styles.learnMoreBtn}
                  onPress={() => Linking.openURL(SCHEME_URLS[key]).catch(() => Alert.alert('Error', 'Could not open link'))}
                >
                  <Text style={styles.learnMoreText}>{t('ui.schemes.learn_more')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyBtn}
                  onPress={() => Linking.openURL(SCHEME_URLS[key]).catch(() => Alert.alert('Error', 'Could not open link'))}
                >
                  <LinearGradient colors={['#58CC02', '#43A047']} style={styles.applyGradient}>
                    <Text style={styles.applyText}>{t('ui.schemes.apply')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getBgColor(key: string) {
  const colors: Record<string, string> = {
    pm_kisan: '#E8F5E9',
    pmfby: '#E3F2FD',
    kcc: '#FFF3E0',
    soil_health: '#F3E5F5',
    pm_kmy: '#EFEBE9',
  };
  return colors[key] || '#F5F5F5';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backBtn: { marginRight: 16, padding: 4 },
  title: { fontSize: 24, fontWeight: '900', color: '#1B5E20' },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#78909C', marginTop: 2 },
  scroll: { padding: 20 },
  schemeCard: { 
    marginBottom: 20, 
    borderRadius: 20, 
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  cardGradient: { padding: 20 },
  cardHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  emojiCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  emoji: { fontSize: 32 },
  schemeName: { fontSize: 18, fontWeight: '900', color: '#2E3A23', marginBottom: 4 },
  schemeDesc: { fontSize: 14, color: '#546E7A', lineHeight: 20, fontWeight: '500' },
  cardFooter: { flexDirection: 'row', gap: 12 },
  learnMoreBtn: { 
    flex: 1, 
    height: 48, 
    borderRadius: 14, 
    borderWidth: 2, 
    borderColor: '#E0E0E0', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  learnMoreText: { fontSize: 14, fontWeight: '800', color: '#546E7A' },
  applyBtn: { flex: 1.5, height: 48, borderRadius: 14, overflow: 'hidden' },
  applyGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  applyText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
