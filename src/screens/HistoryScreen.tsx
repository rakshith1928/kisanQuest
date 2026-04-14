import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { analyticsService } from '../services/analyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

export default function HistoryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      // Wait for player ID to fetch their specific timeline if needed
      // const playerId = await AsyncStorage.getItem('playerId');
      
      // We'll use the timeline endpoint which gets events over time
      // Or to get specific player events: const data = await analyticsService.getPlayerEvents(playerId);
      // Let's assume we want to just see the general timeline for now, or player specific:
      const playerId = await AsyncStorage.getItem('playerId');
      if (!playerId) {
          setError(t('ui.history.no_player_id'));
          setLoading(false);
          return;
      }

      const data = await analyticsService.getPlayerEvents(playerId);
      setTimeline((data as any).events || data);
    } catch (err: any) {
      console.error('Failed to fetch history:', err);
      setError(err.message || t('ui.history.failed_load'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={{fontSize: 24}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('ui.history.title')}</Text>
        <View style={{width: 32}} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
            <Text style={styles.infoText}>{t('ui.history.loading')}</Text>
        ) : error ? (
            <Text style={[styles.infoText, {color: '#b02500'}]}>{error}</Text>
        ) : timeline.length === 0 ? (
            <Text style={styles.infoText}>{t('ui.history.no_choices')}</Text>
        ) : (
          timeline.map((event, index) => {
              const date = new Date(event.timestamp || event.createdAt || Date.now());
              return (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.eventType}>{t('ui.history.action_label', { type: event.eventType })}</Text>
                    <Text style={styles.dateText}>{date.toLocaleDateString()} {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                  </View>
                  
                  {event.eventData && (
                    <View style={styles.dataContainer}>
                      {event.eventData.scenario && <Text style={styles.dataText}>{t('ui.history.scenario_label', { name: event.eventData.scenario })}</Text>}
                      {event.eventData.financialHealth !== undefined && <Text style={styles.dataText}>{t('ui.history.score_result', { score: event.eventData.financialHealth })}</Text>}
                    </View>
                  )}
                </View>
              );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff8ff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  backBtn: { padding: 8, marginLeft: -8 },
  title: { fontSize: 24, fontWeight: '800', color: '#233039' },
  scroll: { flexGrow: 1, padding: 24 },
  infoText: { textAlign: 'center', color: '#4f5d67', fontSize: 16, marginTop: 40, fontStyle: 'italic' },
  historyCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  eventType: { fontSize: 18, fontWeight: '700', color: '#176a21' },
  dateText: { fontSize: 12, color: '#4f5d67', alignSelf: 'center' },
  dataContainer: { backgroundColor: '#f0f4f8', padding: 12, borderRadius: 8 },
  dataText: { fontSize: 14, color: '#233039', marginBottom: 4 }
});
