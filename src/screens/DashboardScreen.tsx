import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import Svg, { Circle } from 'react-native-svg';
import ConfettiCannon from 'react-native-confetti-cannon';

import { TranslatedText } from '../components/TranslatedText';
import gameEngine from '../engine/GameEngine';
import { analyticsService } from '../services/analyticsService';

const screenWidth = Dimensions.get('window').width;

const badgeIcons: Record<string, string> = {
  "First Sown": "🌱",
  "Insured": "🛡️",
  "Debt Free": "💰"
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const AnimatedCircularProgress = ({ score, scoreColor }: any) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = 60;
  const strokeWidth = 14;
  const halfCircle = radius + strokeWidth;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.circularScoreContainer}>
      <Svg width={halfCircle * 2} height={halfCircle * 2} viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}>
        <Circle
          cx="50%"
          cy="50%"
          r={radius}
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx="50%"
          cy="50%"
          r={radius}
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          originX={halfCircle}
          originY={halfCircle}
          rotation="-90"
        />
      </Svg>
      <View style={styles.circularScoreOverlay}>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>{score}</Text>
        <Text style={styles.scoreMax}>/ 100</Text>
      </View>
    </View>
  );
};

const ScaleButton = ({ onPress, style, children, variant = "primary" }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    onPress && onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.btnBase, styles[`btn${variant}` as keyof typeof styles], style]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const SlideInCard = ({ children, delay = 0, style }: any) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
};

export default function DashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState(gameEngine.getState());
  const [events, setEvents] = useState<any[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setGameState(gameEngine.getState());

    const unsubscribe = gameEngine.getStateMachine().onStateChange(() => {
      const newState = gameEngine.getState();
      // Check if badges increased
      if (newState.player.score.badges.length > gameState.player.score.badges.length) {
        setShowConfetti(true);
      }
      setGameState(newState);
    });

    fetchEvents();

    if (gameEngine.getState().player.score.badges.length > 0) {
      setTimeout(() => setShowConfetti(true), 500); // Intro confetti if already have badges
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await analyticsService.getPopularEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  };

  const player = gameState.player;
  const farmName = gameState.player.farm?.name || "Player Profile";
  const netWorth = player.finances.cash + player.finances.savings - player.finances.debt;
  
  // Calculate dynamic score
  const budgetGoal = 50000; // default starting budget
  const rawScore = Math.floor((netWorth / budgetGoal) * 100);
  const score = Math.min(100, Math.max(0, rawScore));

  const message =
    score > 70 ? "Great job! You're managing risks well." :
    score > 40 ? "You're doing okay, but can improve." :
    "Warning: Your finances are unstable!";

  const scoreColor = score > 70 ? '#58CC02' : score > 40 ? '#FFC800' : '#FF4B4B';

  return (
    <SafeAreaView style={styles.container}>
      {showConfetti && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <ConfettiCannon count={100} origin={{ x: screenWidth / 2, y: -20 }} fadeOut />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header Section */}
        <Animated.View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{player.name || "Farmer"}</Text>
            <Text style={styles.subtitle}>{farmName}</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
            <Text style={{ fontSize: 28 }}>👨‍🌾</Text>
          </View>
        </Animated.View>

        {/* Financial Health Score */}
        <SlideInCard delay={100} style={styles.scoreCard}>
          <TranslatedText tKey="ui.dashboard.financial_health" style={styles.cardTitle} />
          
          <AnimatedCircularProgress score={score} scoreColor={scoreColor} />

          <Text style={styles.scoreMessage}>{message}</Text>
          <View style={styles.netWorthTag}>
            <Text style={styles.netWorthText}>
              Net Worth: ₹{netWorth.toLocaleString('en-IN')}
            </Text>
          </View>
        </SlideInCard>

        {/* Milestones & Badges */}
        <SlideInCard delay={200} style={styles.section}>
          <TranslatedText tKey="ui.dashboard.milestones" style={styles.sectionTitle} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
            {player.score.badges.length === 0 ? (
              <Text style={styles.emptyItalic}>No badges yet</Text>
            ) : (
              player.score.badges.map((badge: string) => (
                <View key={badge} style={styles.badgeItem}>
                  <View style={styles.badgeCircle}><Text style={{fontSize: 28}}>{badgeIcons[badge] || "🏅"}</Text></View>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </SlideInCard>

        {/* Season History Timeline */}
        <SlideInCard delay={300} style={styles.section}>
          <View style={styles.rowBetween}>
            <TranslatedText tKey="ui.dashboard.season_history" style={styles.sectionTitle} />
            <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.linkButton}>
                <Text style={styles.linkText}>View Detailed</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {player.seasonHistory.length === 0 ? (
              <Text style={styles.emptyItalic}>No seasons played yet</Text>
            ) : (
              player.seasonHistory.map((history: any, index: number) => {
                const profit = history.finances.cash - history.finances.debt;
                const isPositive = profit >= 0;
                const seasonType = history.season % 2 === 1 ? 'Kharif' : 'Rabi';
                return (
                  <View key={`${history.season}-${index}`} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, !isPositive && { backgroundColor: '#FF4B4B' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineSeason}>Season {history.season} ({seasonType})</Text>
                      <Text style={isPositive ? styles.timelineNetPositive : styles.timelineNetNegative}>
                        {isPositive ? '+' : '-'}₹{Math.abs(profit).toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.timelineSubText}>
                        ₹{history.finances.cash.toLocaleString('en-IN')} | Debt: ₹{history.finances.debt.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </SlideInCard>

        {/* Global Popular Events Analytics */}
        <SlideInCard delay={400} style={styles.section}>
          <Text style={styles.sectionTitle}>Global Popular Events</Text>
          <View style={[styles.card, { paddingHorizontal: 0, overflow: 'hidden' }]}>
            {events.length > 0 ? (
              <BarChart
                data={{
                  labels: events.slice(0, 4).map(e => e._id),
                  datasets: [{ data: events.slice(0, 4).map(e => e.count) }]
                }}
                width={screenWidth - 48}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(88, 204, 2, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(119, 119, 119, ${opacity})`,
                  barPercentage: 0.6,
                }}
                style={{
                  marginVertical: 8,
                }}
              />
            ) : (
               <Text style={[styles.emptyItalic, { padding: 24 }]}>No global events collected yet</Text>
            )}
          </View>
        </SlideInCard>

        {/* Actions */}
        <SlideInCard delay={500} style={styles.actionGroup}>
          <ScaleButton 
            variant="primary" 
            onPress={() => navigation.navigate('Gameplay')}
          >
            <Text style={styles.btnTextPrimary}>Continue Game →</Text>
          </ScaleButton>

          <ScaleButton 
            variant="secondary" 
            style={{ marginTop: 12 }} 
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Text style={styles.btnTextSecondary}>🏆 Leaderboard</Text>
          </ScaleButton>

          <ScaleButton 
            variant="tertiary" 
            style={{ marginTop: 12 }}
            onPress={() => {
              gameEngine.reset();
              navigation.reset({
                index: 0,
                routes: [{ name: 'FarmCreation' }],
              });
            }}
          >
            <Text style={styles.btnTextTertiary}>🌱 Start New Farm</Text>
          </ScaleButton>
        </SlideInCard>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9FA' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#4B4B4B' },
  subtitle: { fontSize: 18, color: '#AFAFAF', marginTop: 4, fontWeight: '600' },
  avatarPlaceholder: { width: 64, height: 64, backgroundColor: '#E5F3FF', borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1CB0F6' },
  scoreCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 32, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#4B4B4B', marginBottom: 24 },
  circularScoreContainer: { width: 148, height: 148, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  circularScoreOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 44, fontWeight: '800' },
  scoreMax: { fontSize: 16, color: '#AFAFAF', marginTop: -4, fontWeight: '700' },
  scoreMessage: { fontSize: 16, color: '#777777', textAlign: 'center', fontWeight: '600', marginBottom: 16 },
  netWorthTag: { backgroundColor: '#F3F3F3', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  netWorthText: { fontSize: 18, fontWeight: '800', color: '#4B4B4B' },
  section: { marginBottom: 32 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#4B4B4B', marginBottom: 16 },
  linkButton: { backgroundColor: '#E5F3FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  linkText: { color: '#1CB0F6', fontWeight: '800', fontSize: 14, textTransform: 'uppercase' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  emptyItalic: { color: '#AFAFAF', fontStyle: 'italic', fontWeight: '600', fontSize: 16 },
  badgeScroll: { gap: 16, paddingBottom: 8 },
  badgeItem: { alignItems: 'center', marginRight: 16 },
  badgeCircle: { width: 80, height: 80, backgroundColor: '#FFC800', borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 4, marginBottom: 12, borderBottomWidth: 4, borderBottomColor: '#D3A500' },
  badgeText: { fontSize: 15, fontWeight: '800', color: '#4B4B4B' },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#58CC02', marginRight: 16, marginTop: 4 },
  timelineContent: { flex: 1 },
  timelineSeason: { fontSize: 18, fontWeight: '800', color: '#4B4B4B', marginBottom: 4 },
  timelineNetPositive: { fontSize: 16, fontWeight: '800', color: '#58CC02' },
  timelineNetNegative: { fontSize: 16, fontWeight: '800', color: '#FF4B4B' },
  timelineSubText: { color: '#AFAFAF', fontSize: 14, marginTop: 4, fontWeight: '600' },
  actionGroup: { marginBottom: 24 },
  btnBase: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4 },
  btnPrimary: { backgroundColor: '#58CC02', borderBottomColor: '#46A302' },
  btnSecondary: { backgroundColor: '#E5F3FF', borderBottomColor: '#BCE4FF' },
  btnTertiary: { backgroundColor: '#FFF0D3', borderBottomColor: '#E5D8BE' },
  btnTextPrimary: { color: '#1B3D01', fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  btnTextSecondary: { color: '#1CB0F6', fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
  btnTextTertiary: { color: '#D3A500', fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
});
