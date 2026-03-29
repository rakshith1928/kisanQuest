import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { gameService } from '../services/gameService';

export default function LeaderboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await gameService.getLeaderboard();
      setPlayers((data as any).leaderboard || data); // handle standard or nested response
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with Back */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{t('ui.leaderboard.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('ui.leaderboard.title')}</Text>
      </View>
      {players.map((p, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.score}>{p.financialScore} {t('ui.leaderboard.pts')}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#e2f5e3',
    borderRadius: 8,
  },
  backText: {
    fontSize: 16,
    color: '#176a21',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  rank: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#4CAF50',
    width: 40,
  },
  name: {
    flex: 1,
    fontSize: 18,
    color: '#333',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
});
