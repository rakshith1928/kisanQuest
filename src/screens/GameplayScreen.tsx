import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { TranslatedText } from '../components/TranslatedText';
import gameEngine from '../engine/GameEngine';

function getWeatherIcon(type: string | undefined) {
  switch (type) {
    case 'good_monsoon': return '🌧️';
    case 'drought': return '☀️';
    case 'flood': return '🌊';
    default: return '☀️';
  }
}

export default function GameplayScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState(gameEngine.getState());
  const [lastOutcome, setLastOutcome] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const node = gameEngine.getCurrentNode();

  useEffect(() => {
    const unsubscribe = gameEngine.getStateMachine().onStateChange(() => {
      setGameState(gameEngine.getState());
    });

    return unsubscribe;
  }, []);

  if (!node) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={styles.eventTitle}>Season Complete 🎉</Text>
        <TouchableOpacity
          style={[styles.primaryAction, { marginTop: 24, width: '100%' }]}
          onPress={() => navigation.replace('Harvest', { outcome: lastOutcome })}
        >
          <Text style={styles.primaryActionText}>View Harvest Results</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryAction, { marginTop: 12, width: '100%' }]}
          onPress={() => navigation.replace('Dashboard')}
        >
          <Text style={styles.secondaryActionText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.seasonText}>
            {gameState.player.farm.season % 2 === 1 ? 'Kharif' : 'Rabi'} Season
          </Text>
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherText}>{getWeatherIcon(lastOutcome?.weather?.type)}</Text>
          </View>
        </View>

        {/* Financial Status Bar */}
        <View style={styles.statusBar}>
          <View style={[styles.statItem, { backgroundColor: '#d1ffc8' }]}>
            <TranslatedText tKey="ui.gameplay.cash" style={[styles.statLabel, { color: '#006016' }]} />
            <Text style={[styles.statValue, { color: '#004b0f' }]}>₹{gameState.player.finances.cash}</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#ffefec' }]}>
            <TranslatedText tKey="ui.gameplay.debt" style={[styles.statLabel, { color: '#b92902' }]} />
            <Text style={[styles.statValue, { color: '#520c00' }]}>₹{gameState.player.finances.debt}</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#fff1db' }]}>
            <TranslatedText tKey="ui.gameplay.savings" style={[styles.statLabel, { color: '#765600' }]} />
            <Text style={[styles.statValue, { color: '#453100' }]}>₹{gameState.player.finances.savings}</Text>
          </View>
        </View>

        {/* Main Hub (Farm Plot) */}
        <View style={styles.mainHub}>
          <View style={styles.farmPlotIllustration} />
          <Text style={styles.farmStatusText}>Crops are growing well...</Text>
        </View>

        {/* Event / Action Area */}
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>Event</Text>
          <Text style={styles.eventDescription}>
            {node?.prompt}
          </Text>

          {lastOutcome?.message && (
            <View style={{ alignItems: 'center', marginBottom: 16, padding: 12, backgroundColor: '#ffffff', borderRadius: 16, elevation: 2 }}>
              <Text style={{ fontSize: 16, color: '#0a6a1d', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                {lastOutcome.message}
              </Text>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                {lastOutcome.financialChanges?.cash !== undefined && (
                  <Text style={{ fontSize: 14, fontWeight: '700', color: lastOutcome.financialChanges.cash >= 0 ? '#0a6a1d' : '#b92902' }}>
                    Cash: {lastOutcome.financialChanges.cash > 0 ? '+' : ''}{lastOutcome.financialChanges.cash}
                  </Text>
                )}
                {lastOutcome.healthDelta !== undefined && (
                  <Text style={{ fontSize: 14, fontWeight: '700', color: lastOutcome.healthDelta >= 0 ? '#0a6a1d' : '#b92902' }}>
                    Score: {lastOutcome.healthDelta > 0 ? '+' : ''}{lastOutcome.healthDelta}
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.actionButtons}>
            {node?.options?.map((opt: any, index: number) => (
              <TouchableOpacity
                key={opt.id || index}
                disabled={isProcessing}
                style={[
                  styles.primaryAction,
                  index === 1 && styles.secondaryAction,
                  index === 2 && styles.tertiaryAction,
                  { opacity: isProcessing ? 0.7 : 1 }
                ]}
                onPress={() => {
                  if (isProcessing) return;
                  setIsProcessing(true);
                  const outcome = gameEngine.processDecision(opt.id) || {};
                  setLastOutcome(outcome);
                  
                  setTimeout(() => {
                    // Sync and track right as the player makes the choice and sees the outcome message
                    const { analyticsService } = require('../services/analyticsService');
                    const { gameService } = require('../services/gameService');
                    
                    const playerState = gameEngine.getState().player;
                    
                    analyticsService.trackEvent(opt.id, {
                        scenario: node.id || 'Unknown',
                        season: playerState.farm.season,
                        crop: playerState.farm.crop,
                        financialHealth: playerState.score.financialHealth 
                    }).catch((err: any) => console.warn('Failed to track decision analytics:', err));

                    const syncPayload = {
                        currentSeason: playerState.farm.season,
                        cash: playerState.finances.cash,
                        debt: playerState.finances.debt,
                        insurance: playerState.finances.insurance,
                        crops: playerState.farm?.crop ? [playerState.farm.crop] : [],
                        decisions: playerState.completedScenarios,
                        seasonHistory: playerState.seasonHistory || []
                    };

                    gameService.syncGameState(syncPayload)
                       .catch((err: any) => console.warn('Failed to sync state:', err));

                    gameEngine.decisionTree.chooseOption(index);
                    setIsProcessing(false);
                    setLastOutcome(null); // Clear message for next node
                  }, 1500);
                }}
              >
                <Text style={[
                  styles.primaryActionText,
                  index === 1 && styles.secondaryActionText,
                  index === 2 && styles.tertiaryActionText
                ]}>{isProcessing ? 'Processing...' : opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f2' },
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
  seasonText: { fontSize: 28, fontWeight: '800', color: '#2d2f2c' },
  weatherBadge: { backgroundColor: '#e8e9e3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  weatherText: { fontSize: 16, fontWeight: '600', color: '#5a5c58' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statItem: { flex: 1, padding: 12, borderRadius: 16, marginHorizontal: 4, alignItems: 'center', elevation: 2 },
  statLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800' },
  mainHub: { alignItems: 'center', marginBottom: 40 },
  farmPlotIllustration: { width: '100%', height: 220, backgroundColor: '#e2e3dd', borderRadius: 32, marginBottom: 16 },
  farmStatusText: { fontSize: 16, fontWeight: '600', color: '#5a5c58' },
  eventCard: { backgroundColor: '#fed3c7', borderRadius: 32, padding: 24, elevation: 4 },
  eventTitle: { fontSize: 22, fontWeight: '800', color: '#51352c', marginBottom: 12 },
  eventDescription: { fontSize: 16, color: '#67483f', lineHeight: 24, marginBottom: 24 },
  actionButtons: { gap: 12 },
  primaryAction: { backgroundColor: '#0a6a1d', paddingVertical: 18, borderRadius: 24, alignItems: 'center', elevation: 4 },
  primaryActionText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  secondaryAction: { backgroundColor: '#ffca52', paddingVertical: 18, borderRadius: 24, alignItems: 'center' },
  secondaryActionText: { color: '#5c4300', fontSize: 18, fontWeight: '700' },
  tertiaryAction: { paddingVertical: 16, alignItems: 'center' },
  tertiaryActionText: { color: '#0a6a1d', fontSize: 16, fontWeight: '700' }
});
