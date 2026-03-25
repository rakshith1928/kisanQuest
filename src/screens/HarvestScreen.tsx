import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import gameEngine from '../engine/GameEngine';

export default function HarvestScreen({ navigation, route }: any) {
  const [gameState, setGameState] = useState(gameEngine.getState());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGameState(gameEngine.getState());
  }, []);

  const score = gameState.player.score.financialHealth;

  useEffect(() => {
    if (score > 80 && !gameState.player.score.badges.includes("Pro Farmer")) {
      gameState.player.score.badges.push("Pro Farmer");
    }
  }, [score, gameState.player.score.badges]);

  const cash = gameState.player.finances.cash;
  const debt = gameState.player.finances.debt;
  const savings = gameState.player.finances.savings;

  const previous = gameState.player.seasonHistory[gameState.player.seasonHistory.length - 1];
  const profit = previous ? cash - previous.finances.cash : cash;

  const net = cash + savings - debt;

  const stars = score > 70 ? 3 : score > 40 ? 2 : 1;
  const yieldText = score > 70 ? "Excellent Yield!" : score > 40 ? "Average Yield!" : "Poor Yield";

  const lastOutcome = route?.params?.lastOutcome;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Season Harvest</Text>
          <View style={styles.starContainer}>
            {[1, 2, 3].map(i => (
              <Text key={i} style={i <= stars ? styles.starFilled : styles.starEmpty}>
                {i <= stars ? '★' : '☆'}
              </Text>
            ))}
          </View>
        </View>

        {/* Visual Results */}
        <View style={styles.visualCard}>
          <View style={styles.harvestIllustration} />
          <Text style={styles.harvestText}>{yieldText}</Text>
          {lastOutcome && (
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#65493f', fontWeight: '600' }}>
                Weather: {lastOutcome.weather?.type || 'Sunny'}
              </Text>
              <Text style={{ fontSize: 16, color: lastOutcome.healthDelta >= 0 ? '#176a21' : '#b02500', fontWeight: '600', marginTop: 4 }}>
                Health Impact: {lastOutcome.healthDelta > 0 ? '+' : ''}{lastOutcome.healthDelta || 0}
              </Text>
            </View>
          )}
        </View>

        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <Text style={styles.summaryTitle}>Financial Overview</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Season Profit</Text>
            <Text style={styles.summaryValuePositive}>
              {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>End-of-Season Debt</Text>
            <Text style={styles.summaryValueNegative}>₹{debt.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryLabelBold}>Net Cash Balance</Text>
            <Text style={styles.summaryValueBold}>₹{net.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Lesson Card */}
        <View style={styles.lessonCard}>
          <Text style={styles.lessonTitle}>💡 Financial Lesson</Text>
          <Text style={styles.lessonBody}>
            {lastOutcome?.lesson || "You've completed the season! Making smart financial decisions is key to a thriving farm."}
          </Text>
        </View>

        {/* Action Area */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={() => {
            if (loading) return;
            setLoading(true);

            gameEngine.advanceSeason();

            setTimeout(() => {
              setLoading(false);
              navigation.replace('Gameplay');
            }, 300);
          }}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Starting...' : 'Next Season'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Review Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff8ff' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#233039', marginBottom: 8 },
  starContainer: { flexDirection: 'row', gap: 8 },
  starFilled: { fontSize: 32, color: '#f7ba00' },
  starEmpty: { fontSize: 32, color: '#a0afb9' },
  visualCard: { backgroundColor: '#f6cfc2', borderRadius: 32, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2 },
  harvestIllustration: { width: '100%', height: 160, backgroundColor: '#e7c1b4', borderRadius: 24, marginBottom: 16 },
  harvestText: { fontSize: 20, fontWeight: '700', color: '#65493f' },
  financialCard: { backgroundColor: '#ffffff', borderRadius: 32, padding: 24, marginBottom: 24, elevation: 4 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#4f5d67', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: '#4f5d67' },
  summaryValuePositive: { fontSize: 16, fontWeight: '700', color: '#176a21' },
  summaryValueNegative: { fontSize: 16, fontWeight: '700', color: '#b02500' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#e3f3ff', paddingTop: 12, marginTop: 4 },
  summaryLabelBold: { fontSize: 18, fontWeight: '800', color: '#233039' },
  summaryValueBold: { fontSize: 18, fontWeight: '800', color: '#233039' },
  lessonCard: { backgroundColor: '#ffca4d', borderRadius: 24, padding: 20, marginBottom: 32, elevation: 6 },
  lessonTitle: { fontSize: 18, fontWeight: '800', color: '#5c4400', marginBottom: 8 },
  lessonBody: { fontSize: 15, color: '#664b00', lineHeight: 22 },
  primaryButton: { backgroundColor: '#176a21', borderRadius: 999, paddingVertical: 20, alignItems: 'center', marginBottom: 16, elevation: 4 },
  primaryButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  secondaryButton: { paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#176a21', fontSize: 18, fontWeight: '700' }
});
