import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Animated, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';
import gameEngine from '../engine/GameEngine';

const { width: W } = Dimensions.get('window');
const xpToNextLevel = 1000;

const badgeIcons: Record<string, string> = {
  'First Sown': '🌱', 'Insured': '🛡️', 'Debt Free': '💰', 'Pro Farmer': '🏆',
};

const DAILY_TASKS = [
  { id: 'q', emoji: '🎮', label: 'Answer 5 questions', xp: 50 },
  { id: 'w', emoji: '💧', label: 'Water your crops',   xp: 20 },
  { id: 'c', emoji: '📊', label: 'Check season stats', xp: 15 },
];

// ─── Animated Circular Progress ───────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
function CircularScore({ score, color }: { score: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const r = 54, sw = 12, hc = r + sw, circ = 2 * Math.PI * r;
  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [score]);
  const offset = anim.interpolate({ inputRange: [0, 100], outputRange: [circ, 0] });
  return (
    <View style={{ width: hc * 2, height: hc * 2, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={hc * 2} height={hc * 2} viewBox={`0 0 ${hc * 2} ${hc * 2}`}>
        <Circle cx="50%" cy="50%" r={r} stroke="#E8F5E9" strokeWidth={sw} fill="transparent" />
        <AnimatedCircle cx="50%" cy="50%" r={r} stroke={color} strokeWidth={sw} fill="transparent"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          originX={hc} originY={hc} rotation="-90" />
      </Svg>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none"
        // centering overlay
      >
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 36, fontWeight: '900', color }}>{score}</Text>
          <Text style={{ fontSize: 12, color: '#90A4AE', fontWeight: '700' }}>/ 100</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Floating Crop ────────────────────────────────────────────────────────────
function FloatingCrop({ emoji, style, delay = 0 }: { emoji: string; style: any; delay?: number }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -8, duration: 1600, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0,  duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.Text style={[style, { transform: [{ translateY: y }] }]}>{emoji}</Animated.Text>;
}

// ─── Farmer Companion ─────────────────────────────────────────────────────────
function FarmerCompanion({ message }: { message: string }) {
  const bounce = useRef(new Animated.Value(0)).current;
  const wave   = useRef(new Animated.Value(0)).current;
  const blink  = useRef(new Animated.Value(1)).current;
  const msgOp  = useRef(new Animated.Value(0)).current;
  const msgY   = useRef(new Animated.Value(8)).current;
  const prevMsg = useRef('');

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -5, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0,  duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(wave, { toValue: 1,  duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(wave, { toValue: -1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(wave, { toValue: 0,  duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.delay(2000),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.delay(3500),
      Animated.timing(blink, { toValue: 0, duration: 70, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 1, duration: 70, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (message === prevMsg.current) return;
    prevMsg.current = message;
    msgOp.setValue(0); msgY.setValue(8);
    Animated.parallel([
      Animated.timing(msgOp, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(msgY,  { toValue: 0, duration: 300, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
    ]).start();
  }, [message]);

  const waveRot = wave.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] });

  return (
    <LinearGradient colors={['#E8F5E9', '#F1F8E9']} style={styles.farmerCard}>
      {/* Character */}
      <Animated.View style={{ transform: [{ translateY: bounce }] }}>
        <View style={styles.fcHatBrim} />
        <View style={styles.fcHatTop} />
        <Animated.View style={[styles.fcFace, { opacity: blink }]}>
          <View style={styles.fcEye} /><View style={styles.fcEye} />
        </Animated.View>
        <View style={styles.fcSmile} />
        <View style={styles.fcShirt}>
          <Animated.View style={[styles.fcArmR, { transform: [{ rotate: waveRot }] }]} />
          <View style={styles.fcArmL} />
        </View>
      </Animated.View>
      {/* Bubble */}
      <Animated.View style={[styles.farmerBubble, { opacity: msgOp, transform: [{ translateY: msgY }] }]}>
        <View style={styles.bubbleTail} />
        <Text style={styles.farmerBubbleText}>{message}</Text>
      </Animated.View>
    </LinearGradient>
  );
}

// ─── Animated Farm Visualization ──────────────────────────────────────────────
function FarmVisualization({ crop, level, isWatered, onWater, onHarvest }: { crop: string | null; level: number; isWatered: boolean; onWater: () => void; onHarvest: () => void }) {
  const CROP_STAGE = level < 2 ? '🌱' : level < 4 ? '🌿' : '🌾';
  const canHarvest = level >= 4;

  const sunScale = useRef(new Animated.Value(1)).current;
  const rainY = useRef(new Animated.Value(-100)).current;
  const xpOp = useRef(new Animated.Value(0)).current;
  const xpY = useRef(new Animated.Value(10)).current;

  const handleWaterPress = () => {
    if (isWatered) return;
    onWater();
    // rain animation
    rainY.setValue(-60);
    Animated.timing(rainY, { toValue: 120, duration: 600, easing: Easing.linear, useNativeDriver: true }).start();
    // XP reward float
    xpOp.setValue(0); xpY.setValue(10);
    Animated.parallel([
      Animated.timing(xpOp, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(xpY, { toValue: -20, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ]).start(() => Animated.timing(xpOp, { toValue: 0, duration: 300, useNativeDriver: true }).start());
  };

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(sunScale, { toValue: 1.08, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(sunScale, { toValue: 1,    duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <LinearGradient colors={['#87CEEB', '#A5D6A7', '#558B2F']} style={styles.farmViz}>
      <Animated.Text style={[styles.vizSun, { transform: [{ scale: sunScale }] }]}>🌞</Animated.Text>
      <FloatingCrop emoji="☁️" style={styles.vizCloud1} delay={0} />
      <FloatingCrop emoji="☁️" style={styles.vizCloud2} delay={800} />
      
      {/* Rainfall overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: rainY }] }]} pointerEvents="none">
         <Text style={{ fontSize: 32, opacity: 0.8, textAlign: 'center', marginTop: -20 }}>💧  💧  💧</Text>
         <Text style={{ fontSize: 32, opacity: 0.8, textAlign: 'center', marginTop: 10 }}> 💧   💧 </Text>
      </Animated.View>

      <View style={styles.vizCropRow}>
        {[0,1,2,3,4,5,6,7].map(i => (
          <FloatingCrop key={i} emoji={CROP_STAGE} style={styles.vizCropEmoji} delay={i * 120} />
        ))}
      </View>
      
      <View style={styles.vizGround}>
        {canHarvest ? (
          <TouchableOpacity onPress={onHarvest} style={[styles.waterBtn, { backgroundColor: '#FFB300', borderColor: '#FF8F00' }]}>
            <Text style={styles.waterBtnText}>🚜 Harvest Now!</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleWaterPress} disabled={isWatered} style={[styles.waterBtn, isWatered && { opacity: 0.6 }]}>
            <Text style={styles.waterBtnText}>{isWatered ? '💧 Watered (+20 XP)' : '💧 Water Crops'}</Text>
          </TouchableOpacity>
        )}
        <Animated.Text style={[styles.waterXpText, { opacity: xpOp, transform: [{ translateY: xpY }] }]}>
          +20 XP!
        </Animated.Text>
        <Text style={styles.vizCropLabel}>
          {crop ? `${crop} Field` : 'Your Farm'} · Level {level}
        </Text>
      </View>
    </LinearGradient>
  );
}

// ─── XP Bar ───────────────────────────────────────────────────────────────────
function XPBar({ xp, level }: { xp: number; level: number }) {
  const pct = (xp % xpToNextLevel) / xpToNextLevel;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: pct, useNativeDriver: false }).start();
  }, [pct]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.xpRow}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>⚔️ Lv {level}</Text>
      </View>
      <View style={styles.xpBarTrack}>
        <Animated.View style={[styles.xpBarFill, { width }]} />
        <Text style={styles.xpLabel}>{xp % xpToNextLevel} / {xpToNextLevel} XP</Text>
      </View>
    </View>
  );
}

// ─── Daily Task Card ──────────────────────────────────────────────────────────
const cannonRef = React.createRef<any>();
function DailyTaskCard({ task, done, onDone }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const checkOp = useRef(new Animated.Value(done ? 1 : 0)).current;

  const handlePress = () => {
    if (done) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    Animated.timing(checkOp, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    cannonRef.current?.start();
    onDone(task.id);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={1} onPress={handlePress}
        style={[styles.taskCard, done && styles.taskCardDone]}>
        <Text style={styles.taskEmoji}>{task.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.taskLabel, done && styles.taskLabelDone]}>{task.label}</Text>
          <Text style={styles.taskXp}>+{task.xp} XP</Text>
        </View>
        <Animated.Text style={[styles.taskCheck, { opacity: checkOp }]}>✅</Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DashboardScreen({ navigation }: any) {
  const [gameState, setGameState] = useState(gameEngine.getState());
  const [showConfetti, setShowConfetti]   = useState(false);
  const [doneTasks, setDoneTasks]         = useState<string[]>([]);
  const [wateredToday, setWateredToday]   = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setGameState(gameEngine.getState());
    Animated.timing(fadeIn, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

    const unsub = gameEngine.getStateMachine().onStateChange(() => {
      const s = gameEngine.getState();
      if (s.player.score.badges.length > gameState.player.score.badges.length) setShowConfetti(true);
      setGameState(s);
    });
    if (gameEngine.getState().player.score.badges.length > 0) setTimeout(() => setShowConfetti(true), 500);
    return () => { if (unsub) unsub(); };
  }, []);

  const player   = gameState.player;
  const farmName = player.farm?.name || 'Your Farm';
  const netWorth = player.finances.cash + player.finances.savings - player.finances.debt;
  const rawScore = Math.floor((netWorth / 50000) * 100);
  const score    = Math.min(100, Math.max(0, rawScore));
  const scoreColor = score > 70 ? '#58CC02' : score > 40 ? '#FFC800' : '#FF4B4B';

  const farmerMsg = useCallback(() => {
    if (player.score.level >= 4) return "Your crops are fully grown! Time to harvest! 🚜";
    if (wateredToday) return "Great job watering! The crops are happy 🌿";
    if (player.score.streak >= 5) return `🔥 ${player.score.streak} day streak! You're on fire!`;
    if (score > 70) return "Your crops are thriving! 🌿 Keep it up!";
    if (score > 40) return "Good progress! 🌱 Ready for today's tasks?";
    return "Let's turn this farm around 💪 Play today!";
  }, [score, player.score.streak, wateredToday, player.score.level]);

  const handleTaskDone = (id: string) => setDoneTasks(p => [...p, id]);

  const handleWater = () => {
    setWateredToday(true);
    if (!doneTasks.includes('w')) {
      handleTaskDone('w');
    }
    gameEngine.addXP(20);
    setGameState({ ...gameEngine.getState() });
  };

  const handleHarvest = () => {
    navigation.navigate('Harvest');
  };

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiCannon count={120} origin={{ x: W / 2, y: -20 }} fadeOut />
        </View>
      )}
      <ConfettiCannon ref={cannonRef} count={40} origin={{ x: W / 2, y: H * 0.4 }} autoStart={false} fadeOut />

      <Animated.View style={{ flex: 1, opacity: fadeIn }}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning 🌅</Text>
            <Text style={styles.playerName}>{player.name || 'Farmer'}</Text>
            <Text style={styles.farmName}>{farmName}</Text>
          </View>
          <View style={styles.streakPill}>
            <Text style={styles.streakText}>🔥 {player.score.streak}</Text>
            <Text style={styles.streakSub}>streak</Text>
          </View>
        </View>

        {/* ── XP Bar ─────────────────────────────────────────── */}
        <XPBar xp={player.score.xp} level={player.score.level} />

        {/* ── Farmer Companion ───────────────────────────────── */}
        <FarmerCompanion message={farmerMsg()} />

        {/* ── Farm Visualization ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌾 Your Farm</Text>
          <FarmVisualization 
            crop={player.farm?.crop} 
            level={player.score.level} 
            isWatered={wateredToday}
            onWater={handleWater}
            onHarvest={handleHarvest}
          />
        </View>

        {/* ── Financial Health ────────────────────────────────── */}
        <View style={[styles.section, styles.healthCard]}>
          <Text style={styles.sectionTitle}>📊 Financial Health</Text>
          <View style={{ alignItems: 'center' }}>
            <CircularScore score={score} color={scoreColor} />
          </View>
          <View style={styles.statRow}>
            <View style={[styles.statChip, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.statChipLabel}>💰 Cash</Text>
              <Text style={[styles.statChipValue, { color: '#2E7D32' }]}>
                ₹{player.finances.cash.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.statChipLabel}>📉 Debt</Text>
              <Text style={[styles.statChipValue, { color: '#E65100' }]}>
                ₹{player.finances.debt.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.statChipLabel}>🏦 Savings</Text>
              <Text style={[styles.statChipValue, { color: '#1565C0' }]}>
                ₹{player.finances.savings.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <View style={styles.netWorthRow}>
            <Text style={styles.netWorthLabel}>Net Worth</Text>
            <Text style={[styles.netWorthValue, { color: scoreColor }]}>
              ₹{netWorth.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* ── Daily Tasks ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Daily Tasks</Text>
          {DAILY_TASKS.map(task => (
            <DailyTaskCard
              key={task.id}
              task={task}
              done={doneTasks.includes(task.id)}
              onDone={handleTaskDone}
            />
          ))}
        </View>

        {/* ── Badges ──────────────────────────────────────────── */}
        {player.score.badges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏅 Achievements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 6 }}>
              {player.score.badges.map((b: string) => (
                <View key={b} style={styles.badgeItem}>
                  <View style={styles.badgeCircle}><Text style={{ fontSize: 28 }}>{badgeIcons[b] || '🏅'}</Text></View>
                  <Text style={styles.badgeLabel}>{b}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Season History ───────────────────────────────────── */}
        {player.seasonHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>📅 Season History</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            {player.seasonHistory.slice(-2).map((h: any, i: number) => {
              const profit = h.finances.cash - h.finances.debt;
              return (
                <View key={i} style={styles.historyRow}>
                  <View style={[styles.historyDot, { backgroundColor: profit >= 0 ? '#58CC02' : '#FF4B4B' }]} />
                  <Text style={styles.historyLabel}>Season {h.season}</Text>
                  <Text style={[styles.historyValue, { color: profit >= 0 ? '#58CC02' : '#FF4B4B' }]}>
                    {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── CTA Buttons ─────────────────────────────────────── */}
        <View style={styles.ctaGroup}>
          <PulseButton onPress={() => navigation.navigate('Gameplay')} color={['#58CC02', '#43A047']}>
            <Text style={styles.ctaTextPrimary}>Continue Farming ▶️</Text>
          </PulseButton>

          <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>🏆 Leaderboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => { gameEngine.reset(); navigation.reset({ index: 0, routes: [{ name: 'FarmCreation' }] }); }}
            style={styles.tertiaryBtn}
          >
            <Text style={styles.tertiaryBtnText}>🌱 New Farm</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Pulsing Button ───────────────────────────────────────────────────────────
function PulseButton({ onPress, color, children }: any) {
  const pulse = useRef(new Animated.Value(1)).current;
  const press = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.03, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: Animated.multiply(pulse, press) }] }}>
      <TouchableOpacity activeOpacity={1}
        onPressIn={() => Animated.spring(press, { toValue: 0.93, useNativeDriver: true }).start()}
        onPressOut={() => { Animated.spring(press, { toValue: 1, friction: 3, useNativeDriver: true }).start(); onPress(); }}
        style={{ borderRadius: 18, overflow: 'hidden', borderBottomWidth: 5, borderBottomColor: '#388E3C' }}>
        <LinearGradient colors={color} style={styles.ctaGradient}>
          {children}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const H = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { fontSize: 13, fontWeight: '700', color: '#78909C', letterSpacing: 0.5 },
  playerName: { fontSize: 28, fontWeight: '900', color: '#1B5E20', lineHeight: 32 },
  farmName: { fontSize: 14, fontWeight: '600', color: '#558B2F' },
  streakPill: { backgroundColor: '#FF5252', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: '#B71C1C' },
  streakText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  streakSub: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

  // XP
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  levelBadge: { backgroundColor: '#1565C0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderBottomWidth: 3, borderBottomColor: '#0D47A1' },
  levelText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  xpBarTrack: { flex: 1, height: 18, backgroundColor: '#C8E6C9', borderRadius: 9, overflow: 'hidden', justifyContent: 'center' },
  xpBarFill: { position: 'absolute', height: '100%', backgroundColor: '#FFC800', borderRadius: 9 },
  xpLabel: { textAlign: 'center', fontSize: 10, fontWeight: '800', color: '#1B5E20', zIndex: 1 },

  // Farmer companion
  farmerCard: { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, borderWidth: 1.5, borderColor: '#A5D6A7', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  fcHatBrim: { width: 44, height: 8, backgroundColor: '#388E3C', borderRadius: 4, alignSelf: 'center' },
  fcHatTop: { width: 32, height: 18, backgroundColor: '#4CAF50', borderRadius: 5, alignSelf: 'center' },
  fcFace: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFCC80', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', paddingHorizontal: 6, borderWidth: 2, borderColor: '#FFA726', alignSelf: 'center' },
  fcEye: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4E342E' },
  fcSmile: { width: 22, height: 10, borderRadius: 10, borderBottomWidth: 2.5, borderColor: '#E65100', borderTopWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, alignSelf: 'center', marginTop: -3 },
  fcShirt: { width: 52, height: 34, backgroundColor: '#1565C0', borderRadius: 7, flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'center' },
  fcArmR: { width: 12, height: 26, backgroundColor: '#FFCC80', borderRadius: 6, marginTop: 5, marginLeft: -4 },
  fcArmL: { width: 12, height: 26, backgroundColor: '#FFCC80', borderRadius: 6, marginTop: 5, marginRight: -4 },
  farmerBubble: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, borderWidth: 1.5, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  bubbleTail: { position: 'absolute', left: -9, top: 14, width: 0, height: 0, borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#FFFFFF' },
  farmerBubbleText: { fontSize: 14, fontWeight: '600', color: '#37474F', lineHeight: 20 },

  // Farm viz
  farmViz: { borderRadius: 20, overflow: 'hidden', height: 160, justifyContent: 'flex-end', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },
  vizSun: { position: 'absolute', top: 10, right: 14, fontSize: 32 },
  vizCloud1: { position: 'absolute', top: 12, left: 20, fontSize: 22, opacity: 0.8 },
  vizCloud2: { position: 'absolute', top: 24, left: 70, fontSize: 16, opacity: 0.6 },
  vizCropRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: 60 },
  vizCropEmoji: { fontSize: 22 },
  vizGround: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(46,125,50,0.85)', paddingVertical: 12, paddingBottom: 16, alignItems: 'center' },
  vizCropLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 0.4, marginTop: 6 },
  waterBtn: { backgroundColor: '#29B6F6', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, borderWidth: 2, borderColor: '#0288D1', alignSelf: 'center', zIndex: 10 },
  waterBtnText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  waterXpText: { position: 'absolute', bottom: 50, color: '#FFD54F', fontSize: 24, fontWeight: '900', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: {width: 0, height: 2} },

  // Sections
  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#2E3A23', marginBottom: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAllBtn: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  viewAllText: { color: '#2E7D32', fontWeight: '800', fontSize: 13 },

  // Health card
  healthCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 10 },
  statChip: { flex: 1, borderRadius: 14, padding: 10, alignItems: 'center' },
  statChipLabel: { fontSize: 10, fontWeight: '700', color: '#78909C', marginBottom: 4 },
  statChipValue: { fontSize: 13, fontWeight: '900' },
  netWorthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E8F5E9', paddingTop: 12 },
  netWorthLabel: { fontSize: 14, fontWeight: '700', color: '#546E7A' },
  netWorthValue: { fontSize: 20, fontWeight: '900' },

  // Daily tasks
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: '#E0E0E0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, gap: 12 },
  taskCardDone: { backgroundColor: '#F1F8E9', borderColor: '#A5D6A7' },
  taskEmoji: { fontSize: 28 },
  taskLabel: { fontSize: 15, fontWeight: '700', color: '#37474F' },
  taskLabelDone: { color: '#78909C', textDecorationLine: 'line-through' },
  taskXp: { fontSize: 12, fontWeight: '700', color: '#FFA726', marginTop: 2 },
  taskCheck: { fontSize: 22 },

  // Badges
  badgeItem: { alignItems: 'center', width: 80 },
  badgeCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF9C4', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#F9A825', marginBottom: 6 },
  badgeLabel: { fontSize: 11, fontWeight: '700', color: '#546E7A', textAlign: 'center' },

  // Season history
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  historyDot: { width: 12, height: 12, borderRadius: 6 },
  historyLabel: { flex: 1, fontSize: 14, fontWeight: '700', color: '#546E7A' },
  historyValue: { fontSize: 15, fontWeight: '800' },

  // CTA
  ctaGroup: { gap: 12 },
  ctaGradient: { height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  ctaTextPrimary: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  secondaryBtn: { backgroundColor: '#E3F2FD', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#BBDEFB' },
  secondaryBtnText: { color: '#1565C0', fontSize: 16, fontWeight: '800' },
  tertiaryBtn: { backgroundColor: '#FFF8E1', borderRadius: 16, height: 52, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#FFE082' },
  tertiaryBtnText: { color: '#F57F17', fontSize: 16, fontWeight: '800' },
});
