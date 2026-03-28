import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import gameEngine from '../engine/GameEngine';

const ScaleButton = ({ onPress, disabled, style, children, variant = "primary" }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => { if (!disabled) Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start(); };
  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
      onPress && onPress();
    }
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: disabled ? 0.6 : 1 }}>
      <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[styles.btnBase, styles[`btn${variant}` as keyof typeof styles], style]}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HarvestScreen({ navigation, route }: any) {
  const [gameState, setGameState] = useState(gameEngine.getState());
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setGameState(gameEngine.getState());
  }, []);

  const score = gameState.player.score.financialHealth;

  useEffect(() => {
    let earnedBadge = false;
    if (score > 80 && !gameState.player.score.badges.includes("Pro Farmer")) {
      gameState.player.score.badges.push("Pro Farmer");
      earnedBadge = true;
    }
    
    // Fire confetti on great score or new badge
    if (earnedBadge || score > 70) {
      setTimeout(() => setShowConfetti(true), 500);
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
      {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: -10, y: 0 }}
          autoStart={true}
          fadeOut={true}
          fallSpeed={3000}
        />
      )}
      
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
          <View style={styles.harvestIllustrationBox}>
            <Text style={{fontSize: 64}}>🌾</Text>
          </View>
          <Text style={styles.harvestText}>{yieldText}</Text>
          {lastOutcome && (
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#4B4B4B', fontWeight: '800' }}>
                Weather: {lastOutcome.weather?.type || 'Sunny'}
              </Text>
              <Text style={{ fontSize: 16, color: lastOutcome.healthDelta >= 0 ? '#58CC02' : '#FF4B4B', fontWeight: '800', marginTop: 4 }}>
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
            <Text style={profit >= 0 ? styles.summaryValuePositive : styles.summaryValueNegative}>
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
        <ScaleButton
          variant="primary"
          disabled={loading}
          onPress={() => {
            if (loading) return;
            setLoading(true);
            gameEngine.advanceSeason();
            setTimeout(() => {
              setLoading(false);
              navigation.replace('Gameplay');
            }, 500);
          }}
          style={{ marginBottom: 16 }}
        >
          <Text style={styles.btnTextPrimary}>{loading ? 'Starting...' : 'Next Season'}</Text>
        </ScaleButton>
        
        <ScaleButton variant="secondary" onPress={() => navigation.navigate('History')} style={{ marginBottom: 16 }}>
          <Text style={styles.btnTextSecondary}>Review Details</Text>
        </ScaleButton>
        
        <ScaleButton variant="tertiary" onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.btnTextTertiary}>Back to Dashboard</Text>
        </ScaleButton>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9FA' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#4B4B4B', marginBottom: 8 },
  starContainer: { flexDirection: 'row', gap: 8 },
  starFilled: { fontSize: 36, color: '#FFC800' },
  starEmpty: { fontSize: 36, color: '#E5E5E5' },
  
  visualCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, borderWidth: 2, borderColor: '#E5E5E5' },
  harvestIllustrationBox: { width: 120, height: 120, backgroundColor: '#FFF0D3', borderRadius: 60, marginBottom: 16, justifyContent: 'center', alignItems: 'center' },
  harvestText: { fontSize: 24, fontWeight: '800', color: '#4B4B4B' },
  
  financialCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, borderWidth: 2, borderColor: '#E5E5E5' },
  summaryTitle: { fontSize: 20, fontWeight: '800', color: '#4B4B4B', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: '#AFAFAF', fontWeight: '800' },
  summaryValuePositive: { fontSize: 16, fontWeight: '800', color: '#58CC02' },
  summaryValueNegative: { fontSize: 16, fontWeight: '800', color: '#FF4B4B' },
  summaryTotalRow: { borderTopWidth: 2, borderTopColor: '#E5E5E5', paddingTop: 16, marginTop: 8 },
  summaryLabelBold: { fontSize: 18, fontWeight: '800', color: '#4B4B4B' },
  summaryValueBold: { fontSize: 18, fontWeight: '800', color: '#4B4B4B' },
  
  lessonCard: { backgroundColor: '#FFF0D3', borderRadius: 24, padding: 20, marginBottom: 32, elevation: 2, borderWidth: 2, borderColor: '#FFC800' },
  lessonTitle: { fontSize: 20, fontWeight: '800', color: '#D3A500', marginBottom: 8 },
  lessonBody: { fontSize: 16, color: '#A07E00', lineHeight: 24, fontWeight: '600' },
  
  btnBase: { borderRadius: 20, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, paddingHorizontal: 24 },
  btnPrimary: { backgroundColor: '#58CC02', borderBottomColor: '#46A302' },
  btnSecondary: { backgroundColor: '#E5F3FF', borderBottomColor: '#BCE4FF', borderWidth: 2, borderColor: '#1CB0F6', borderBottomWidth: 8 },
  btnTertiary: { backgroundColor: '#FFFFFF', borderBottomColor: '#E5E5E5', borderWidth: 2, borderColor: '#E5E5E5', borderBottomWidth: 8 },
  btnTextPrimary: { color: '#1B3D01', fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  btnTextSecondary: { color: '#1CB0F6', fontSize: 18, fontWeight: '800', textTransform: 'uppercase',  letterSpacing: 0.5 },
  btnTextTertiary: { color: '#AFAFAF', fontSize: 18, fontWeight: '800', textTransform: 'uppercase',  letterSpacing: 0.5 }
});
