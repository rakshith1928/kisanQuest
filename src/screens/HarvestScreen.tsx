import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Easing, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import gameEngine from '../engine/GameEngine';
import { useTranslation } from 'react-i18next';

const { width: W } = Dimensions.get('window');

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimCounter({ target, prefix = '', suffix = '', color = '#2E3A23' }: {
  target: number; prefix?: string; suffix?: string; color?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    Animated.timing(anim, { toValue: target, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [target]);
  return (
    <Text style={{ fontSize: 32, fontWeight: '900', color }}>
      {prefix}{display.toLocaleString('en-IN')}{suffix}
    </Text>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ stars }: { stars: number }) {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    anims.forEach((a, i) => {
      setTimeout(() => {
        Animated.spring(a, { toValue: i < stars ? 1 : 0.3, friction: 3, tension: 80, useNativeDriver: true }).start();
      }, i * 200);
    });
  }, [stars]);
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
      {anims.map((a, i) => (
        <Animated.Text key={i} style={{ fontSize: 40, transform: [{ scale: a }] }}>
          {i < stars ? '⭐' : '☆'}
        </Animated.Text>
      ))}
    </View>
  );
}

// ─── Farmer Celebration ───────────────────────────────────────────────────────
function FarmerCelebration({ yieldText }: { yieldText: string }) {
  const { t } = useTranslation();
  const bounce = useRef(new Animated.Value(0)).current;
  const rot    = useRef(new Animated.Value(0)).current;
  const msgScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -14, duration: 350, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0,   duration: 350, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
      Animated.delay(400),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(rot, { toValue: 1,  duration: 200, useNativeDriver: true }),
      Animated.timing(rot, { toValue: -1, duration: 200, useNativeDriver: true }),
      Animated.timing(rot, { toValue: 0,  duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
    ])).start();
    setTimeout(() => {
      Animated.spring(msgScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }, 400);
  }, []);

  const rotate = rot.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] });

  return (
    <View style={styles.farmerCelebRow}>
      <Animated.View style={{ transform: [{ translateY: bounce }] }}>
        <Animated.Text style={{ fontSize: 60, transform: [{ rotate }] }}>🧑‍🌾</Animated.Text>
      </Animated.View>
      <Animated.View style={[styles.celebBubble, { transform: [{ scale: msgScale }] }]}>
        <View style={styles.bubbleTail} />
        <Text style={styles.celebMsg}>{t('ui.harvest.amazing_work')}</Text>
        <Text style={styles.celebSub}>{yieldText}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Summary Stat Card ────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color, bg }: any) {
  const slideY = useRef(new Animated.Value(20)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.summaryCard, { backgroundColor: bg, transform: [{ translateY: slideY }], opacity: fadeIn }]}>
      <Text style={styles.summaryIcon}>{icon}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HarvestScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const [gameState, setGameState]     = useState(gameEngine.getState());
  const [loading, setLoading]         = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setGameState(gameEngine.getState());
    const score = gameEngine.getState().player.score.financialHealth;
    if (score > 70 || !gameState.player.score.badges.includes('Pro Farmer')) {
      if (score > 80) gameEngine.getState().player.score.badges.push('Pro Farmer');
    }
    setTimeout(() => setShowConfetti(true), 400);
  }, []);

  const player   = gameState.player;
  const score    = player.score.financialHealth;
  const cash     = player.finances.cash;
  const debt     = player.finances.debt;
  const savings  = player.finances.savings;
  const prev     = player.seasonHistory[player.seasonHistory.length - 1];
  const profit   = prev ? cash - prev.finances.cash : cash;
  const net      = cash + savings - debt;
  const stars    = score > 70 ? 3 : score > 40 ? 2 : 1;
  const yieldText = score > 70 ? t('ui.harvest.yield.thriving') : score > 40 ? t('ui.harvest.yield.decent') : t('ui.harvest.yield.tough');
  const xpGained = player.score.xp;
  const lastOutcome = route?.params?.outcome;

  const gradColors: [string, string, string] = score > 70
    ? ['#1B5E20', '#388E3C', '#A5D6A7']
    : score > 40
      ? ['#E65100', '#FF8F00', '#FFE082']
      : ['#4A148C', '#7B1FA2', '#CE93D8'];

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && (
        <>
          <ConfettiCannon count={200} origin={{ x: 0,       y: -10 }} fadeOut autoStart fallSpeed={3500} />
          <ConfettiCannon count={200} origin={{ x: W,       y: -10 }} fadeOut autoStart fallSpeed={3200} />
          <ConfettiCannon count={80}  origin={{ x: W / 2,   y: -10 }} fadeOut autoStart fallSpeed={3800} />
        </>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero Banner ─────────────────────────────────────── */}
        <LinearGradient colors={gradColors} style={styles.heroBanner}>
          <Text style={styles.heroTitle}>{t('ui.harvest.title')}</Text>
          <StarRating stars={stars} />
          <Text style={styles.heroSub}>{t('ui.harvest.season_label', { season: player.farm.season })}</Text>
          <Text style={styles.heroCropText}>{t('ui.harvest.crop_label', { crop: player.farm.crop || t('ui.harvest.mixed') })}</Text>
        </LinearGradient>

        {/* ── Farmer Celebration ─────────────────────────────── */}
        <View style={styles.section}>
          <FarmerCelebration yieldText={yieldText} />
        </View>

        {/* ── Reward Counters ─────────────────────────────────── */}
        <View style={styles.rewardRow}>
          <View style={styles.rewardChip}>
            <Text style={styles.rewardIcon}>💰</Text>
            <Text style={styles.rewardLabel}>{t('ui.harvest.earnings')}</Text>
            <AnimCounter target={Math.max(0, profit)} prefix="₹" color="#2E7D32" />
          </View>
          <View style={[styles.rewardChip, { backgroundColor: '#FFF9C4' }]}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <Text style={styles.rewardLabel}>{t('ui.harvest.xp_gained_label')}</Text>
            <AnimCounter target={xpGained} prefix="+" suffix=" XP" color="#F57F17" />
          </View>
          <View style={[styles.rewardChip, { backgroundColor: '#E3F2FD' }]}>
            <Text style={styles.rewardIcon}>🚀</Text>
            <Text style={styles.rewardLabel}>{t('ui.harvest.level_label')}</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#1565C0' }}>{player.score.level}</Text>
          </View>
        </View>

        {/* ── Financial Summary ─────────────────────────────────── */}
        <View style={[styles.section, styles.finCard]}>
          <Text style={styles.sectionTitle}>{t('ui.harvest.fin_overview')}</Text>
          <View style={styles.finRow}>
            <Text style={styles.finRowLabel}>{t('ui.harvest.season_profit')}</Text>
            <Text style={[styles.finRowValue, { color: profit >= 0 ? '#2E7D32' : '#C62828' }]}>
              {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.finRow}>
            <Text style={styles.finRowLabel}>{t('ui.harvest.cash_balance')}</Text>
            <Text style={[styles.finRowValue, { color: '#1565C0' }]}>₹{cash.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.finRow}>
            <Text style={styles.finRowLabel}>{t('ui.harvest.outstanding_debt')}</Text>
            <Text style={[styles.finRowValue, { color: '#C62828' }]}>₹{debt.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.finRow, styles.finTotalRow]}>
            <Text style={styles.finTotalLabel}>{t('ui.harvest.net_worth')}</Text>
            <Text style={[styles.finTotalValue, { color: net >= 0 ? '#2E7D32' : '#C62828' }]}>
              ₹{net.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* ── Summary Cards ─────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>{t('ui.harvest.performance_breakdown')}</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard icon="🌱" label={t('ui.harvest.crop_label', { crop: '' }).replace(': ', '')} value={player.farm.crop || t('ui.harvest.mixed')} color="#2E7D32" bg="#E8F5E9" />
          <SummaryCard
            icon={score > 70 ? '💹' : score > 40 ? '📊' : '📉'}
            label={t('ui.harvest.risk_profit')}
            value={score > 70 ? t('ui.harvest.performance.excellent') : score > 40 ? t('ui.harvest.performance.average') : t('ui.harvest.performance.poor')}
            color={score > 70 ? '#2E7D32' : score > 40 ? '#E65100' : '#C62828'}
            bg={score > 70 ? '#E8F5E9' : score > 40 ? '#FFF3E0' : '#FFEBEE'}
          />
          <SummaryCard icon="☀️" label={t('ui.harvest.weather_impact')} value={lastOutcome?.weather?.type || t('ui.harvest.weather_status.favorable')} color="#1565C0" bg="#E3F2FD" />
          <SummaryCard icon="🔥" label={t('ui.harvest.streak')} value={`${player.score.streak} days`} color="#C62828" bg="#FFEBEE" />
        </View>

        {/* ── Lesson Card ──────────────────────────────────────── */}
        <View style={styles.lessonCard}>
          <Text style={styles.lessonTitle}>{t('ui.harvest.fin_lesson')}</Text>
          <Text style={styles.lessonBody}>
            {lastOutcome?.lesson || t('ui.harvest.lesson_default', { defaultValue: "You've completed the season! Smart financial decisions are key to a thriving farm. Keep learning and growing!" })}
          </Text>
        </View>

        {/* ── CTA Buttons ──────────────────────────────────────── */}
        <CTAButton
          colors={['#43A047', '#2E7D32']}
          shadowColor="#1B5E20"
          disabled={loading}
          onPress={() => {
            if (loading) return;
            setLoading(true);
            gameEngine.advanceSeason();
            setTimeout(() => { setLoading(false); navigation.replace('Gameplay'); }, 500);
          }}
        >
          <Text style={styles.ctaPrimary}>{loading ? t('ui.harvest.starting') : t('ui.harvest.next_season')}</Text>
        </CTAButton>

        <TouchableOpacity style={styles.ctaSecondary} onPress={() => navigation.navigate('History')}>
          <Text style={styles.ctaSecondaryText}>{t('ui.harvest.review_details')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctaTertiary} onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.ctaTertiaryText}>{t('ui.harvest.back_dashboard')}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CTAButton({ colors, shadowColor, disabled, onPress, children }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[{ transform: [{ scale }] }, { marginBottom: 12 }]}>
      <TouchableOpacity
        activeOpacity={1}
        disabled={disabled}
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start()}
        onPressOut={() => { Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start(); onPress(); }}
        style={{ borderRadius: 18, overflow: 'hidden', borderBottomWidth: 5, borderBottomColor: shadowColor, opacity: disabled ? 0.7 : 1 }}
      >
        <LinearGradient colors={colors} style={{ paddingVertical: 18, alignItems: 'center' }}>
          {children}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  scroll: { paddingBottom: 40 },

  // Hero
  heroBanner: { padding: 28, alignItems: 'center', paddingTop: 36, paddingBottom: 32 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 14 },
  heroSub: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  heroCropText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginTop: 4 },

  // Farmer celebration
  farmerCelebRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
  celebBubble: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  bubbleTail: { position: 'absolute', left: -9, top: 14, width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#FFFFFF' },
  celebMsg: { fontSize: 16, fontWeight: '900', color: '#2E3A23', marginBottom: 4 },
  celebSub: { fontSize: 13, fontWeight: '600', color: '#558B2F', lineHeight: 18 },

  // Rewards
  rewardRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  rewardChip: { flex: 1, backgroundColor: '#E8F5E9', borderRadius: 18, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  rewardIcon: { fontSize: 26, marginBottom: 4 },
  rewardLabel: { fontSize: 11, fontWeight: '700', color: '#78909C', marginBottom: 6 },

  // Financial Card
  finCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, marginBottom: 20 },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F8E9' },
  finRowLabel: { fontSize: 14, fontWeight: '700', color: '#78909C' },
  finRowValue: { fontSize: 16, fontWeight: '900' },
  finTotalRow: { borderTopWidth: 2, borderTopColor: '#E8F5E9', borderBottomWidth: 0, marginTop: 4, paddingTop: 14 },
  finTotalLabel: { fontSize: 16, fontWeight: '900', color: '#2E3A23' },
  finTotalValue: { fontSize: 20, fontWeight: '900' },

  // Summary grid
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 20 },
  summaryCard: { width: (W - 52) / 2, borderRadius: 18, padding: 16, alignItems: 'center' },
  summaryIcon: { fontSize: 28, marginBottom: 6 },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: '#78909C', marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '900', textAlign: 'center' },

  // Lesson
  lessonCard: { backgroundColor: '#FFF9C4', borderRadius: 18, padding: 18, marginHorizontal: 16, marginBottom: 24, borderWidth: 1.5, borderColor: '#F9A825' },
  lessonTitle: { fontSize: 16, fontWeight: '900', color: '#F57F17', marginBottom: 8 },
  lessonBody: { fontSize: 14, fontWeight: '600', color: '#5D4037', lineHeight: 20 },

  // CTAs
  ctaPrimary: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  ctaSecondary: { backgroundColor: '#E3F2FD', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#BBDEFB', marginHorizontal: 16, marginBottom: 12 },
  ctaSecondaryText: { color: '#1565C0', fontSize: 16, fontWeight: '800' },
  ctaTertiary: { backgroundColor: '#F5F5F5', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#E0E0E0', marginHorizontal: 16 },
  ctaTertiaryText: { color: '#546E7A', fontSize: 16, fontWeight: '800' },

  // Shared
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#2E3A23', paddingHorizontal: 16 },
});
