import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import gameEngine from '../engine/GameEngine';

const badgeIcons: Record<string, string> = {
  "First Sown": "🌱",
  "Insured": "🛡️",
  "Debt Free": "💰"
};

export default function DashboardScreen({ navigation }: any) {
  const [gameState, setGameState] = useState(gameEngine.getState());

  useEffect(() => {
    setGameState(gameEngine.getState()); // sync once

    const unsubscribe = gameEngine.getStateMachine().onStateChange(() => {
      setGameState(gameEngine.getState());
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const player = gameState.player;
  const score = player.score.financialHealth;

  const message =
    score > 70 ? "Great job! You're managing risks well." :
      score > 40 ? "You're doing okay, but can improve." :
        "Warning: Your finances are unstable!";

  const scoreColor =
    score > 70 ? '#176a21' :
      score > 40 ? '#f59e0b' :
        '#b02500';

  const netWorth = player.finances.cash + player.finances.savings - player.finances.debt;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Player Profile</Text>
            <Text style={{ fontSize: 18, color: '#4f5d67', marginTop: 4 }}>
              {player.name || "Farmer"}
            </Text>
          </View>
          <View style={[styles.avatarPlaceholder, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 24 }}>👨‍🌾</Text>
          </View>
        </View>

        {/* Financial Health Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Financial Health</Text>
          <View style={[styles.circularScore, { borderColor: scoreColor }]}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>
          <View style={{ width: '100%', height: 8, backgroundColor: '#ddd', borderRadius: 4, marginTop: 10, marginBottom: 16 }}>
            <View style={{ width: `${Math.min(100, Math.max(0, score))}%`, height: '100%', backgroundColor: scoreColor, borderRadius: 4 }} />
          </View>
          <Text style={styles.scoreSubtitle}>{message}</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#233039', marginTop: 12 }}>
            Net Worth: ₹{netWorth.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Milestones & Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlocked Badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
            {player.score.badges.length === 0 ? (
              <Text style={[styles.badgeText, { color: '#4f5d67', fontStyle: 'italic' }]}>No badges yet</Text>
            ) : (
              player.score.badges.map((badge) => (
                <View key={badge} style={styles.badgeItem}>
                  <View style={styles.badgeCircle}><Text>{badgeIcons[badge] || "🏅"}</Text></View>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Season History Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Season History</Text>
          <View style={styles.timelineCard}>
            {player.seasonHistory.length === 0 ? (
              <Text style={{ color: '#4f5d67', fontStyle: 'italic' }}>No seasons played yet</Text>
            ) : (
              player.seasonHistory.map((history, index) => {
                const profit = history.finances.cash - history.finances.debt;
                const isPositive = profit >= 0;
                const seasonType = history.season % 2 === 1 ? 'Kharif' : 'Rabi';
                return (
                  <View key={`${history.season}-${index}`} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, !isPositive && { backgroundColor: '#b02500' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineSeason}>Season {history.season} ({seasonType})</Text>
                      <Text style={isPositive ? styles.timelineNetPositive : styles.timelineNetNegative}>
                        {isPositive ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
                      </Text>
                      <Text style={{ color: '#4f5d67', fontSize: 12, marginTop: 2 }}>
                        ₹{history.finances.cash.toLocaleString('en-IN')} | Debt: ₹{history.finances.debt.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Continue Game Button */}
        <TouchableOpacity
          style={{ marginTop: 20, backgroundColor: '#176a21', padding: 16, borderRadius: 12, alignItems: 'center' }}
          onPress={() => navigation.navigate('Gameplay')}
        >
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>Continue Game →</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff8ff' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#233039' },
  avatarPlaceholder: { width: 56, height: 56, backgroundColor: '#9df197', borderRadius: 28 },
  scoreCard: { backgroundColor: '#ffffff', borderRadius: 32, padding: 32, alignItems: 'center', marginBottom: 32, elevation: 4 },
  scoreTitle: { fontSize: 20, fontWeight: '700', color: '#4f5d67', marginBottom: 16 },
  circularScore: { width: 140, height: 140, borderRadius: 70, borderWidth: 12, borderColor: '#176a21', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  scoreValue: { fontSize: 40, fontWeight: '800', color: '#176a21' },
  scoreMax: { fontSize: 16, color: '#4f5d67', marginTop: -4 },
  scoreSubtitle: { fontSize: 15, color: '#4f5d67', textAlign: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#233039', marginBottom: 16 },
  badgeScroll: { gap: 16 },
  badgeItem: { alignItems: 'center', marginRight: 16 },
  badgeCircle: { width: 72, height: 72, backgroundColor: '#ffca4d', borderRadius: 36, justifyContent: 'center', alignItems: 'center', elevation: 4, marginBottom: 8 },
  badgeText: { fontSize: 14, fontWeight: '600', color: '#5c4400' },
  timelineCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, elevation: 4 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#176a21', marginRight: 16, marginTop: 4 },
  timelineContent: { flex: 1 },
  timelineSeason: { fontSize: 18, fontWeight: '700', color: '#4f5d67', marginBottom: 4 },
  timelineNetPositive: { fontSize: 16, fontWeight: '700', color: '#176a21' },
  timelineNetNegative: { fontSize: 16, fontWeight: '700', color: '#b02500' }
});
