import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import LottieView from 'lottie-react-native';
import { TranslatedText } from '../components/TranslatedText';
import gameEngine from '../engine/GameEngine';

const screenWidth = Dimensions.get('window').width;

const xpToNextLevel = 1000;

function getWeatherIcon(type: string | undefined) {
  switch (type) {
    case 'good_monsoon': return '🌧️';
    case 'drought': return '☀️';
    case 'flood': return '🌊';
    case 'good_winter': return '❄️';
    case 'cold_wave': return '🥶';
    case 'unseasonal_rain': return '⛈️';
    default: return '🌤️';
  }
}

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

export default function GameplayScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState(gameEngine.getState());
  const [lastOutcome, setLastOutcome] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const node = gameEngine.getCurrentNode();

  const xpProgressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = gameEngine.getStateMachine().onStateChange(() => {
      setGameState(gameEngine.getState());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // Animate XP bar whenever XP changes
    const currentExp = gameState.player.score.xp % xpToNextLevel;
    const percentage = (currentExp / xpToNextLevel) * 100;
    
    Animated.spring(xpProgressAnim, {
      toValue: percentage,
      useNativeDriver: false,
    }).start();
  }, [gameState.player.score.xp]);

  useEffect(() => {
    const p = gameState.phase;
    if (p === 'SEASON_START' || p === 'ONBOARDING' || p === 'FARM_CREATION') {
        try {
            const sm = gameEngine.getStateMachine();
            if (p === 'ONBOARDING') sm.transition('FARM_CREATION');
            if (p === 'ONBOARDING' || p === 'FARM_CREATION') sm.transition('SEASON_START');
            
            if (!gameEngine.getState().scenario) {
                gameEngine.loadRandomScenario().then(() => {
                    sm.transition('WEATHER_REVEAL');
                    setGameState(gameEngine.getState());
                });
            } else {
                sm.transition('WEATHER_REVEAL');
                setGameState(gameEngine.getState());
            }
        } catch(e) { console.warn("Auto-transition failed", e); }
    } else if (!gameState.scenario && ['WEATHER_REVEAL', 'MARKET_UPDATE', 'DECISION_POINT'].includes(p as string)) {
        gameEngine.loadRandomScenario().then(() => setGameState(gameEngine.getState()));
    }
  }, [gameState.phase, gameState.scenario]);

  const handleAdvancePhase = (nextPhase: any) => {
    if (isProcessing) return;
    try {
        gameEngine.getStateMachine().transition(nextPhase);
        setGameState(gameEngine.getState());
    } catch (e) {
        console.log("Phase transition error", e);
    }
  };

  const currentPhase = gameState.phase;

  if (currentPhase === 'HARVEST_REVIEW') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
        <Text style={styles.eventTitle}>Season Complete 🎉</Text>
        <ScaleButton variant="primary" style={{ marginTop: 24, paddingHorizontal: 32 }} onPress={() => navigation.replace('Harvest', { outcome: lastOutcome })}>
          <Text style={styles.btnTextPrimary}>View Harvest Results</Text>
        </ScaleButton>
      </View>
    );
  }

  const renderWeatherReveal = () => (
      <View style={styles.eventCard}>
         <Text style={styles.eventTitle}>Weather Forecast ☁️</Text>
         <Text style={styles.eventDescription}>The season is starting. Predictable weather is crucial for a healthy harvest. Let's see what the skies bring.</Text>
         <ScaleButton onPress={() => handleAdvancePhase('MARKET_UPDATE')} variant="primary" style={{marginTop: 24}}>
             <Text style={styles.btnTextPrimary}>Continue →</Text>
         </ScaleButton>
      </View>
  );

  const renderMarketUpdate = () => (
      <View style={[styles.eventCard, { backgroundColor: '#E5F3FF' }]}>
         <Text style={[styles.eventTitle, {color: '#1CB0F6'}]}>Mandi Market Pulse 📈</Text>
         <Text style={[styles.eventDescription, {color: '#4B4B4B'}]}>Market prices fluctuate based on supply and demand. Unlocked skills like Negotiation will boost your final sale price at Harvest.</Text>
         <ScaleButton onPress={() => handleAdvancePhase('DECISION_POINT')} variant="secondary" style={{marginTop: 24}}>
             <Text style={styles.btnTextSecondary}>Start Farm Events →</Text>
         </ScaleButton>
      </View>
  );

  const renderDecisionPoint = () => (
      <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>{node?.options && node.options.length > 0 ? "Farm Event" : "Event Outcome 💡"}</Text>
          <Text style={styles.eventDescription}>{node?.prompt}</Text>

          {/* Render the lesson if it's an outcome node */}
          {(node as any)?.lesson && (
              <View style={[styles.outcomeBanner, { backgroundColor: '#FFF0D3', borderColor: '#FFC800' }]}>
                  <Text style={[styles.outcomeMessage, { color: '#D3A500', marginBottom: 8 }]}>💡 Lesson Learned</Text>
                  <Text style={{ fontSize: 16, color: '#4B4B4B', fontWeight: '600', textAlign: 'center', lineHeight: 22 }}>
                      {(node as any).lesson}
                  </Text>
              </View>
          )}

          {lastOutcome?.message && (
            <View style={styles.outcomeBanner}>
              <Text style={styles.outcomeMessage}>{lastOutcome.message}</Text>
              <View style={styles.outcomeStatsRow}>
                {lastOutcome.financialChanges?.cash !== undefined && (
                  <Text style={[styles.outcomeStatText, {color: lastOutcome.financialChanges.cash >= 0 ? '#58CC02' : '#FF4B4B'}]}>
                    Cash: {lastOutcome.financialChanges.cash > 0 ? '+' : ''}{lastOutcome.financialChanges.cash}
                  </Text>
                )}
                {lastOutcome.literacyPoints !== undefined && (
                  <Text style={[styles.outcomeStatText, {color: '#1CB0F6'}]}>
                    +{lastOutcome.literacyPoints} LP
                  </Text>
                )}
                <Text style={[styles.outcomeStatText, {color: '#FFC800'}]}>+150 XP</Text>
              </View>
            </View>
          )}

          <View style={styles.actionButtons}>
            {node?.options && node.options.length > 0 ? (
                node.options.map((opt: any, index: number) => {
                   // Cycle variants for duolingo aesthetic
                   const variant = index === 0 ? "primary" : index === 1 ? "secondary" : "tertiary";
                   return (
                     <ScaleButton
                        key={opt.id || index}
                        disabled={isProcessing}
                        variant={variant}
                        onPress={() => {
                            if (isProcessing) return;
                            setIsProcessing(true);
                            const outcome = gameEngine.processDecision(opt.id) || {};
                            setLastOutcome(outcome);
                            
                            setTimeout(() => {
                               // Next node or map to Harvest if scenario tree is complete
                               const result = gameEngine.decisionTree.chooseOption(index);
                               if (result?.isEnd) {
                                   if (gameEngine.getState().eventsCompleted < 3) {
                                       gameEngine.loadRandomScenario().then(() => {
                                           setGameState(gameEngine.getState());
                                           setIsProcessing(false);
                                           setLastOutcome(null);
                                       });
                                       return;
                                   } else {
                                       gameEngine.getStateMachine().transition('HARVEST_REVIEW');
                                   }
                               }
                               setGameState(gameEngine.getState());
                               setIsProcessing(false);
                               setLastOutcome(null);
                            }, 2500); // slightly longer wait to read the outcome banner
                        }}
                     >
                        <Text style={styles[`btnText${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles]}>
                            {isProcessing ? 'Processing...' : opt.label}
                        </Text>
                     </ScaleButton>
                   );
                })
            ) : (
                <ScaleButton
                    variant="primary"
                    onPress={() => {
                        if (gameEngine.getState().eventsCompleted < 3) {
                            gameEngine.loadRandomScenario().then(() => {
                                setGameState(gameEngine.getState());
                            });
                        } else {
                            gameEngine.getStateMachine().transition('HARVEST_REVIEW');
                            setGameState(gameEngine.getState());
                        }
                    }}
                >
                    <Text style={styles.btnTextPrimary}>
                        {gameEngine.getState().eventsCompleted < 3 ? "Next Event →" : "Complete Season →"}
                    </Text>
                </ScaleButton>
            )}
          </View>
      </View>
  );

  const xpWidth = xpProgressAnim.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%']
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* RPG Top Bar */}
      <View style={styles.topBar}>
          <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lvl {gameState.player.score.level}</Text>
          </View>
          <View style={styles.xpBarContainer}>
             <Animated.View style={[styles.xpBarFill, { width: xpWidth }]} />
             <Text style={styles.xpTextOverlay}>{gameState.player.score.xp % xpToNextLevel} / {xpToNextLevel}</Text>
          </View>
          <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {gameState.player.score.streak}</Text>
          </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.seasonText}>
            Season {gameState.player.farm.season}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SkillTree')} style={styles.skillBtn}>
             <Text style={styles.skillBtnText}>🧠 Skills</Text>
          </TouchableOpacity>
        </View>

        {/* Financial Status Bar */}
        <View style={styles.statusBar}>
          <View style={[styles.statItem, { backgroundColor: '#F2FBF1', borderColor: '#58CC02' }]}>
            <TranslatedText tKey="ui.gameplay.cash" style={[styles.statLabel, { color: '#58CC02' }]} />
            <Text style={[styles.statValue, { color: '#46A302' }]}>₹{gameState.player.finances.cash}</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#FFF4F4', borderColor: '#FF4B4B' }]}>
            <TranslatedText tKey="ui.gameplay.debt" style={[styles.statLabel, { color: '#FF4B4B' }]} />
            <Text style={[styles.statValue, { color: '#DA2C2C' }]}>₹{gameState.player.finances.debt}</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#FFF0D3', borderColor: '#FFC800' }]}>
            <TranslatedText tKey="ui.gameplay.savings" style={[styles.statLabel, { color: '#FFC800' }]} />
            <Text style={[styles.statValue, { color: '#D3A500' }]}>₹{gameState.player.finances.savings}</Text>
          </View>
        </View>

        {/* Dynamic Phase Content */}
        {currentPhase === 'WEATHER_REVEAL' && renderWeatherReveal()}
        {currentPhase === 'MARKET_UPDATE' && renderMarketUpdate()}
        {currentPhase === 'DECISION_POINT' && renderDecisionPoint()}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9FA' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 2, borderBottomColor: '#E5E5E5' },
  levelBadge: { backgroundColor: '#E5F3FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 2, borderColor: '#1CB0F6' },
  levelText: { color: '#1CB0F6', fontWeight: '800', fontSize: 14 },
  xpBarContainer: { flex: 1, height: 20, backgroundColor: '#E5E5E5', borderRadius: 10, marginHorizontal: 12, overflow: 'hidden', justifyContent: 'center' },
  xpBarFill: { position: 'absolute', height: '100%', backgroundColor: '#FFC800', borderRadius: 10 },
  xpTextOverlay: { textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#4B4B4B', zIndex: 1 },
  streakBadge: { backgroundColor: '#FFF4F4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 2, borderColor: '#FF4B4B' },
  streakText: { color: '#FF4B4B', fontWeight: '800', fontSize: 14 },
  
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  seasonText: { fontSize: 32, fontWeight: '800', color: '#4B4B4B' },
  skillBtn: { backgroundColor: '#E5F3FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderWidth: 2, borderColor: '#1CB0F6' },
  skillBtnText: { color: '#1CB0F6', fontWeight: '800', fontSize: 16 },
  
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statItem: { flex: 1, padding: 12, borderRadius: 16, marginHorizontal: 4, alignItems: 'center', borderWidth: 2 },
  statLabel: { fontSize: 12, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '800' },
  
  eventCard: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 28, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, borderWidth: 2, borderColor: '#E5E5E5' },
  eventTitle: { fontSize: 24, fontWeight: '800', color: '#4B4B4B', marginBottom: 12 },
  eventDescription: { fontSize: 18, color: '#777777', lineHeight: 26, marginBottom: 28, fontWeight: '600' },
  actionButtons: { gap: 16 },
  
  outcomeBanner: { alignItems: 'center', marginBottom: 24, padding: 16, backgroundColor: '#F2FBF1', borderRadius: 20, borderWidth: 2, borderColor: '#58CC02' },
  outcomeMessage: { fontSize: 18, color: '#46A302', fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  outcomeStatsRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  outcomeStatText: { fontSize: 15, fontWeight: '800' },
  
  btnBase: { borderRadius: 20, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, paddingHorizontal: 24 },
  btnPrimary: { backgroundColor: '#58CC02', borderBottomColor: '#46A302' },
  btnSecondary: { backgroundColor: '#E5F3FF', borderBottomColor: '#BCE4FF', borderWidth: 2, borderColor: '#1CB0F6', borderBottomWidth: 4 },
  btnTertiary: { backgroundColor: '#FFFFFF', borderBottomColor: '#E5E5E5', borderWidth: 2, borderColor: '#E5E5E5', borderBottomWidth: 4 },
  btnTextPrimary: { color: '#1B3D01', fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  btnTextSecondary: { color: '#1CB0F6', fontSize: 18, fontWeight: '800', textTransform: 'uppercase',  letterSpacing: 0.5 },
  btnTextTertiary: { color: '#AFAFAF', fontSize: 18, fontWeight: '800', textTransform: 'uppercase',  letterSpacing: 0.5 }
});
