import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BASE_URL } from '../config/api';

export default function LeaderboardScreen() {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // NOTE: For physical Android device testing, replace localhost with your machine's local IP address (e.g. 192.168.1.100)
      const res = await fetch(`${BASE_URL}/api/game/leaderboard`);
      const data = await res.json();
      setPlayers(data.leaderboard || data); // handle standard or nested response
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Top Farmers 🏆</Text>
      {players.map((p, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.rank}>#{index + 1}</Text>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.score}>{p.financialScore} pts</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
