import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import gameEngine from '../engine/GameEngine';
import { useTranslation } from 'react-i18next';
import VoiceManager from '../voice/VoiceManager';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Gameplay'>;

const { width: W } = Dimensions.get('window');
const XP_TO_NEXT = 1000;
const MAX_HEARTS = 3;

// ─── Farmer Reaction ──────────────────────────────────────────────────────────
function FarmerReaction({ type, visible }: { type: 'correct' | 'wrong' | 'idle'; visible: boolean }) {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scale.setValue(0);
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true }).start();
      Animated.loop(Animated.sequence([
        Animated.timing(bounce, { toValue: -6, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,  duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    } else {
      scale.setValue(0);
    }
  }, [visible, type]);

  if (!visible) return null;

  const isCorrect = type === 'correct';
  const msg = isCorrect ? t('ui.gameplay.reaction.correct') : t('ui.gameplay.reaction.wrong');
  const bg  = isCorrect ? '#E8F5E9' : '#FFF3E0';
  const bdr = isCorrect ? '#A5D6A7' : '#FFCC80';

  return (
    <Animated.View style={[styles.reactionCard, { backgroundColor: bg, borderColor: bdr, transform: [{ scale }, { translateY: bounce }] }]}>
      <Text style={styles.reactionEmoji}>{isCorrect ? '🧑‍🌾✨' : '🧑‍🌾💭'}</Text>
      <Text style={[styles.reactionText, { color: isCorrect ? '#2E7D32' : '#E65100' }]}>{msg}</Text>
    </Animated.View>
  );
}

// ─── Floating XP Toast ────────────────────────────────────────────────────────
function XPToast({ xp, visible }: { xp: number; visible: boolean }) {
  const y   = useRef(new Animated.Value(0)).current;
  const op  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible) return;
    y.setValue(0); op.setValue(1);
    Animated.parallel([
      Animated.timing(y,  { toValue: -60, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([Animated.delay(500), Animated.timing(op, { toValue: 0, duration: 400, useNativeDriver: true })]),
    ]).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <Animated.View style={[styles.xpToast, { opacity: op, transform: [{ translateY: y }] }]}>
      <Text style={styles.xpToastText}>+{xp} XP ✨</Text>
    </Animated.View>
  );
}

// ─── Option Answer Card ───────────────────────────────────────────────────────
function OptionCard({ label, onPress, state, disabled }: {
  label: string; onPress: () => void;
  state: 'idle' | 'correct' | 'wrong'; disabled: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'correct') {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.07, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
      ]).start();
    }
    if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 10,  duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 8,   duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -8,  duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0,   duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const bg  = state === 'correct' ? '#E8F5E9' : state === 'wrong' ? '#FFEBEE' : '#FFFFFF';
  const bdr = state === 'correct' ? '#66BB6A' : state === 'wrong' ? '#EF9A9A' : '#E0E0E0';

  return (
    <Animated.View style={{ transform: [{ scale }, { translateX: shakeX }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled}
        style={[styles.optionCard, { backgroundColor: bg, borderColor: bdr }]}
      >
        {state === 'correct' && <Text style={styles.optionIcon}>✅</Text>}
        {state === 'wrong'   && <Text style={styles.optionIcon}>❌</Text>}
        {state === 'idle'    && <View style={styles.optionRadio} />}
        {state === 'idle'    && <View style={styles.optionRadio} />}
        <Text style={[styles.optionLabel, state === 'correct' && { color: '#2E7D32', fontWeight: '900' }, state === 'wrong' && { color: '#C62828' }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function GameplayScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [gameState, setGameState]   = useState(gameEngine.getState());
  const [lastOutcome, setLastOutcome] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chosenOption, setChosenOption] = useState<string | null>(null);
  const [reactionType, setReactionType] = useState<'correct' | 'wrong' | 'idle'>('idle');
  const [showReaction, setShowReaction] = useState(false);
  const [showXP, setShowXP]           = useState(false);
  const [hearts, setHearts]           = useState(MAX_HEARTS);
  const [showConfetti, setShowConfetti] = useState(false);

  const node = gameEngine.getCurrentNode();
  const xpAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardFade  = useRef(new Animated.Value(1)).current;
  const confettiRef = useRef<any>(null);

  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const speakIdRef = useRef(0);

  const handleSpeakPrompt = async () => {
    const vp = node?.voicePrompt;
    if (!vp) return;

    if (isPlayingVoice) {
      speakIdRef.current++;
      VoiceManager.stopSpeaking();
      setIsPlayingVoice(false);
      return;
    }

    const text = t(vp);

    speakIdRef.current++;
    VoiceManager.stopSpeaking();

    const id = speakIdRef.current;
    setIsPlayingVoice(true);

    try {
      await VoiceManager.speak(text);
    } finally {
      if (speakIdRef.current === id) {
        setIsPlayingVoice(false);
      }
    }
  };

  useEffect(() => {
    speakIdRef.current++;
    setIsPlayingVoice(false);

    return () => {
      speakIdRef.current++;
      VoiceManager.stopSpeaking();
    };
  }, [node?.id, gameState.player.language]);

  useEffect(() => {
    const unsub = gameEngine.getStateMachine().onStateChange(() => setGameState(gameEngine.getState()));
    return unsub;
  }, []);

  useEffect(() => {
    const xpPct = ((gameState.player.score.xp % XP_TO_NEXT) / XP_TO_NEXT) * 100;
    Animated.spring(xpAnim, { toValue: xpPct, useNativeDriver: false }).start();
  }, [gameState.player.score.xp]);

  // Auto-advance early phases
  useEffect(() => {
    const p = gameState.phase;
    if (['SEASON_START', 'ONBOARDING', 'FARM_CREATION'].includes(p as string)) {
      try {
        const sm = gameEngine.getStateMachine();
        if (p === 'ONBOARDING') sm.transition('FARM_CREATION');
        if (p === 'ONBOARDING' || p === 'FARM_CREATION') sm.transition('SEASON_START');
        if (!gameEngine.getState().scenario) {
          gameEngine.loadRandomScenario().then(() => { sm.transition('WEATHER_REVEAL'); setGameState(gameEngine.getState()); });
        } else { sm.transition('WEATHER_REVEAL'); setGameState(gameEngine.getState()); }
      } catch (e) { console.warn('Auto-transition failed', e); }
    } else if (!gameState.scenario && ['WEATHER_REVEAL', 'MARKET_UPDATE', 'DECISION_POINT'].includes(p as string)) {
      gameEngine.loadRandomScenario().then(() => setGameState(gameEngine.getState()));
    }
  }, [gameState.phase, gameState.scenario]);

  const advancePhase = (next: any) => {
    try { gameEngine.getStateMachine().transition(next); setGameState(gameEngine.getState()); } catch (e) {}
  };

  // Bounce card on new question
  const bounceCard = useCallback(() => {
    cardScale.setValue(0.92); cardFade.setValue(0);
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(cardFade,  { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleChoice = (optId: string, optIndex: number) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setChosenOption(optId);

    const outcome = gameEngine.processDecision(optId) || {};
    setLastOutcome(outcome);

    const correct = ((outcome as any).healthDelta || 0) >= 0;
    setReactionType(correct ? 'correct' : 'wrong');
    setShowReaction(true);
    if (correct) {
      setShowXP(true);
      confettiRef.current?.start();
      setShowConfetti(false);
    } else {
      setHearts(h => Math.max(0, h - 1));
    }

    setTimeout(() => {
      setShowReaction(false);
      setShowXP(false);
      const result = gameEngine.decisionTree.chooseOption(optIndex);
      if (result?.isEnd) {
        if (gameEngine.getState().eventsCompleted < 5) {
          gameEngine.loadRandomScenario().then(() => {
            setGameState(gameEngine.getState());
            setChosenOption(null);
            setIsProcessing(false);
            setLastOutcome(null);
            bounceCard();
          });
          return;
        } else {
          gameEngine.getStateMachine().transition('HARVEST_REVIEW');
        }
      }
      setGameState(gameEngine.getState());
      setChosenOption(null);
      setIsProcessing(false);
      setLastOutcome(null);
      bounceCard();
    }, 2200);
  };

  const handleNextAfterOutcome = () => {
    if (gameEngine.getState().eventsCompleted < 5) {
      gameEngine.loadRandomScenario().then(() => { setGameState(gameEngine.getState()); bounceCard(); });
    } else {
      gameEngine.getStateMachine().transition('HARVEST_REVIEW');
      setGameState(gameEngine.getState());
    }
  };

  const xpWidth = xpAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
  const phase   = gameState.phase;
  const evDone  = gameEngine.getState().eventsCompleted;

  // Harvest redirect
  if (phase === 'HARVEST_REVIEW') {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ConfettiCannon count={200} origin={{ x: W / 2, y: -20 }} fadeOut autoStart />
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
        <Text style={styles.harvestTitle}>{t('ui.gameplay.season_complete')}</Text>
        <Text style={styles.harvestSub}>{t('ui.gameplay.amazing_work')}</Text>
        <TouchableOpacity
          style={styles.harvestBtn}
          onPress={() => navigation.replace('Harvest', { outcome: lastOutcome })}
        >
          <Text style={styles.harvestBtnText}>{t('ui.gameplay.view_harvest_results')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Weather Reveal ──────────────────────────────────────────────────────────
  const renderWeather = () => (
    <LinearGradient colors={['#1565C0', '#42A5F5', '#B3E5FC']} style={styles.phaseCard}>
      <Text style={styles.phaseBigEmoji}>🌤️</Text>
      <Text style={styles.phaseTitle}>{t('ui.gameplay.weather_forecast')}</Text>
      <Text style={styles.phaseDesc}>
        {t('ui.gameplay.weather_forecast_desc')}
      </Text>
      <TouchableOpacity style={styles.phaseBtn} onPress={() => advancePhase('MARKET_UPDATE')}>
        <Text style={styles.phaseBtnText}>{t('ui.gameplay.continue')}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  // ── Market Update ───────────────────────────────────────────────────────────
  const renderMarket = () => (
    <LinearGradient colors={['#1B5E20', '#388E3C', '#A5D6A7']} style={styles.phaseCard}>
      <Text style={styles.phaseBigEmoji}>📈</Text>
      <Text style={styles.phaseTitle}>{t('ui.gameplay.market_pulse')}</Text>
      <Text style={styles.phaseDesc}>
        {t('ui.gameplay.market_pulse_desc')}
      </Text>
      <TouchableOpacity style={[styles.phaseBtn, { backgroundColor: '#FFC800' }]} onPress={() => advancePhase('DECISION_POINT')}>
        <Text style={[styles.phaseBtnText, { color: '#1B3D01' }]}>{t('ui.gameplay.start_events')}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  // ── Decision Point ──────────────────────────────────────────────────────────
  const renderDecision = () => {
    const hasOptions = node?.options && node.options.length > 0;
    const isOutcome  = (node as any)?.type === 'outcome';

    return (
      <View>
        {/* Progress Bar */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>{t('ui.gameplay.event_label', { current: Math.min(evDone + 1, 5), total: 5 })}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(Math.min(evDone, 5) / 5) * 100}%` }]} />
          </View>
          <View style={styles.heartsRow}>
            {Array.from({ length: MAX_HEARTS }).map((_, i) => (
              <Text key={i} style={{ fontSize: 16, opacity: i < hearts ? 1 : 0.25 }}>❤️</Text>
            ))}
          </View>
        </View>

        {/* Question Card */}
        <Animated.View style={[styles.questionCard, { transform: [{ scale: cardScale }], opacity: cardFade }]}>
          {/* floating animation indicator */}
          <LinearGradient colors={['#F1F8E9', '#FFFFFF']} style={styles.questionGradient}>
            <Text style={styles.questionEmoji}>🧠</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.questionText, { flex: 1 }]}>{t(node?.prompt || '...')}</Text>
              <TouchableOpacity onPress={handleSpeakPrompt} style={{ padding: 8, marginLeft: 8 }}>
                <Ionicons name={isPlayingVoice ? "volume-high" : "volume-medium-outline"} size={28} color="#43A047" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Lesson */}
        {(node as any)?.lesson && (
          <View style={styles.lessonBanner}>
            <Text style={styles.lessonTitle}>{t('ui.gameplay.lesson_learned')}</Text>
            <Text style={styles.lessonBody}>{t((node as any).lesson)}</Text>
          </View>
        )}

        {/* Outcome feedback */}
        {lastOutcome?.message && (
          <View style={[styles.outcomeBanner, { borderColor: (lastOutcome.healthDelta || 0) >= 0 ? '#66BB6A' : '#EF9A9A' }]}>
            <Text style={[styles.outcomeMsg, { color: (lastOutcome.healthDelta || 0) >= 0 ? '#2E7D32' : '#C62828' }]}>
              {t(lastOutcome.message)}
            </Text>
            <View style={styles.outcomeStats}>
              {lastOutcome.financialChanges?.cash !== undefined && (
                <View style={[styles.outcomeStat, { backgroundColor: lastOutcome.financialChanges.cash >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.outcomeStatText, { color: lastOutcome.financialChanges.cash >= 0 ? '#2E7D32' : '#C62828' }]}>
                    {lastOutcome.financialChanges.cash > 0 ? '+' : ''}₹{lastOutcome.financialChanges.cash}
                  </Text>
                </View>
              )}
              <View style={[styles.outcomeStat, { backgroundColor: '#E3F2FD' }]}>
                <Text style={[styles.outcomeStatText, { color: '#1565C0' }]}>+{lastOutcome.literacyPoints || 0} LP</Text>
              </View>
              <View style={[styles.outcomeStat, { backgroundColor: '#FFF9C4' }]}>
                <Text style={[styles.outcomeStatText, { color: '#F57F17' }]}>+150 XP</Text>
              </View>
            </View>
          </View>
        )}

        {/* Farmer Reaction */}
        <FarmerReaction type={reactionType} visible={showReaction} />
        <XPToast xp={150} visible={showXP} />

        {/* Options / Next */}
        <View style={styles.optionsGrid}>
          {hasOptions ? (
            (node?.options ?? []).map((opt: any, i: number) => {
              const st = chosenOption === null ? 'idle'
                : chosenOption === opt.id
                  ? ((lastOutcome?.healthDelta || 0) >= 0 ? 'correct' : 'wrong')
                  : 'idle';
              return (
                <OptionCard
                  key={opt.id || i}
                  label={isProcessing ? (chosenOption === opt.id ? t('ui.gameplay.feedback.processing') : t(opt.label)) : t(opt.label)}
                  state={st}
                  disabled={isProcessing}
                  onPress={() => handleChoice(opt.id, i)}
                />
              );
            })
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNextAfterOutcome}>
              <Text style={styles.nextBtnText}>{evDone < 4 ? t('ui.gameplay.next_event') : t('ui.gameplay.complete_season')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ConfettiCannon ref={confettiRef} count={80} origin={{ x: W / 2, y: 100 }} autoStart={false} fadeOut />

      {/* ── Top Bar ─────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.levelPill}>
          <Text style={styles.levelText}>{t('ui.gameplay.level_label', { level: gameState.player.score.level })}</Text>
        </View>
        <View style={styles.xpTrack}>
          <Animated.View style={[styles.xpFill, { width: xpWidth }]} />
          <Text style={styles.xpOverlay}>{t('ui.gameplay.xp_label', { xp: gameState.player.score.xp % XP_TO_NEXT })}</Text>
        </View>
        <View style={styles.streakPill}>
          <Text style={styles.streakText}>🔥 {gameState.player.score.streak}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Finance Strip ────────────────────────────────────── */}
        <View style={styles.financeStrip}>
          <View style={[styles.finChip, { backgroundColor: '#E8F5E9' }]}>
            <Text style={styles.finLabel}>💰 Cash</Text>
            <Text style={[styles.finValue, { color: '#2E7D32' }]}>₹{gameState.player.finances.cash.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.finChip, { backgroundColor: '#FFEBEE' }]}>
            <Text style={styles.finLabel}>📉 Debt</Text>
            <Text style={[styles.finValue, { color: '#C62828' }]}>₹{gameState.player.finances.debt.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.finChip, { backgroundColor: '#FFF9C4' }]}>
            <Text style={styles.finLabel}>🏦 Savings</Text>
            <Text style={[styles.finValue, { color: '#F57F17' }]}>₹{gameState.player.finances.savings.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* ── Phase Content ──────────────────────────────────────── */}
        {phase === 'WEATHER_REVEAL' && renderWeather()}
        {phase === 'MARKET_UPDATE'  && renderMarket()}
        {phase === 'DECISION_POINT' && renderDecision()}

        {/* ── Season + Skills Header ────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.seasonLabel}>{t('ui.gameplay.season_label', { season: gameState.player.farm.season })}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SkillTree')} style={styles.skillBtn}>
            <Text style={styles.skillBtnText}>🧠 {t('ui.gameplay.skills')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 2, borderBottomColor: '#E8F5E9' },
  levelPill: { backgroundColor: '#1565C0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  levelText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  xpTrack: { flex: 1, height: 18, backgroundColor: '#E8F5E9', borderRadius: 9, overflow: 'hidden', justifyContent: 'center' },
  xpFill: { position: 'absolute', height: '100%', backgroundColor: '#FFC800', borderRadius: 9 },
  xpOverlay: { textAlign: 'center', fontSize: 10, fontWeight: '800', color: '#37474F', zIndex: 1 },
  streakPill: { backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.5, borderColor: '#FFCDD2' },
  streakText: { color: '#C62828', fontWeight: '800', fontSize: 12 },

  scroll: { padding: 16, paddingBottom: 40 },

  // Finance strip
  financeStrip: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  finChip: { flex: 1, borderRadius: 14, padding: 10, alignItems: 'center' },
  finLabel: { fontSize: 10, fontWeight: '700', color: '#78909C', marginBottom: 3 },
  finValue: { fontSize: 12, fontWeight: '900' },

  // Phase cards (weather/market)
  phaseCard: { borderRadius: 24, padding: 28, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 5 },
  phaseBigEmoji: { fontSize: 56, marginBottom: 12 },
  phaseTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', marginBottom: 10 },
  phaseDesc: { fontSize: 15, color: 'rgba(255,255,255,0.9)', fontWeight: '600', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  phaseBtn: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28, borderBottomWidth: 3, borderBottomColor: 'rgba(0,0,0,0.1)' },
  phaseBtnText: { fontSize: 16, fontWeight: '900', color: '#1565C0' },

  // Progress bar
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  progressLabel: { fontSize: 12, fontWeight: '800', color: '#78909C', width: 68 },
  progressTrack: { flex: 1, height: 10, backgroundColor: '#C8E6C9', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#43A047', borderRadius: 5 },
  heartsRow: { flexDirection: 'row', gap: 2 },

  // Question Card
  questionCard: { borderRadius: 24, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 14, elevation: 6 },
  questionGradient: { padding: 24, alignItems: 'center' },
  questionEmoji: { fontSize: 44, marginBottom: 12 },
  questionText: { fontSize: 19, fontWeight: '800', color: '#2E3A23', textAlign: 'center', lineHeight: 28 },

  // Lesson banner
  lessonBanner: { backgroundColor: '#FFF9C4', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#F9A825' },
  lessonTitle: { fontSize: 14, fontWeight: '800', color: '#F57F17', marginBottom: 4 },
  lessonBody: { fontSize: 14, fontWeight: '600', color: '#5D4037', lineHeight: 20 },

  // Outcome banner
  outcomeBanner: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
  outcomeMsg: { fontSize: 15, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  outcomeStats: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  outcomeStat: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  outcomeStatText: { fontSize: 13, fontWeight: '800' },

  // Reaction
  reactionCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 12, marginBottom: 16, borderWidth: 1.5 },
  reactionEmoji: { fontSize: 28 },
  reactionText: { fontSize: 15, fontWeight: '800', flex: 1 },

  // XP Toast
  xpToast: { position: 'absolute', top: 100, alignSelf: 'center', backgroundColor: '#FFC800', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  xpToastText: { fontSize: 16, fontWeight: '900', color: '#1B3D01' },

  // Option cards
  optionsGrid: { gap: 12, marginBottom: 20 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 16, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  optionRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: '#B0BEC5' },
  optionIcon: { fontSize: 22 },
  optionLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: '#37474F', lineHeight: 22 },

  // Next button (for outcome-only nodes)
  nextBtn: { backgroundColor: '#43A047', borderRadius: 18, paddingVertical: 18, alignItems: 'center', borderBottomWidth: 4, borderBottomColor: '#2E7D32' },
  nextBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  seasonLabel: { fontSize: 22, fontWeight: '900', color: '#2E3A23' },
  skillBtn: { backgroundColor: '#E3F2FD', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14, borderWidth: 2, borderColor: '#90CAF9' },
  skillBtnText: { color: '#1565C0', fontWeight: '800', fontSize: 14 },

  // Harvest redirect
  harvestTitle: { fontSize: 30, fontWeight: '900', color: '#2E3A23', marginBottom: 8 },
  harvestSub: { fontSize: 17, fontWeight: '600', color: '#558B2F', marginBottom: 32 },
  harvestBtn: { backgroundColor: '#43A047', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 40, borderBottomWidth: 5, borderBottomColor: '#2E7D32' },
  harvestBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
});
