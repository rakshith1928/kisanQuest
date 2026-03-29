import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import gameEngine from '../engine/GameEngine';

const { width: W, height: H } = Dimensions.get('window');

// ─── Data ─────────────────────────────────────────────────────────────────────
const CROPS = [
  { id: 'Rice', emoji: '🌾', label: 'Rice', water: 0.9, profit: 65000, risk: 'Low', recommended: false, color: '#43A047' },
  { id: 'Wheat', emoji: '🌿', label: 'Wheat', water: 0.6, profit: 52000, risk: 'Low', recommended: true, color: '#F9A825' },
  { id: 'Cotton', emoji: '☁️', label: 'Cotton', water: 0.5, profit: 80000, risk: 'Medium', recommended: false, color: '#29B6F6' },
  { id: 'Sugarcane', emoji: '🎋', label: 'Sugarcane', water: 0.95, profit: 95000, risk: 'High', recommended: false, color: '#AB47BC' },
];

const WEATHER = { condition: 'Sunny', temp: '32°C', emoji: '☀️', gradient: ['#1565C0', '#42A5F5', '#A5D6A7'] as const };

const SOIL = { type: 'Red Soil', quality: 'Good', season: 'Summer', seasonEmoji: '☀️' };

const BUDGET_MILESTONES = [
  { value: 10000, label: '₹10k', emoji: '🌱' },
  { value: 50000, label: '₹50k', emoji: '🚜' },
  { value: 100000, label: '₹1L', emoji: '🏡' },
];

const riskColor = (risk: string) =>
  risk === 'Low' ? '#58CC02' : risk === 'Medium' ? '#FFC800' : '#FF4B4B';

// ─── Floating Cloud ────────────────────────────────────────────────────────────
function Cloud({ style }: { style: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: W + 80, duration: 14000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(anim, { toValue: -80, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.Text style={[style, { transform: [{ translateX: anim }] }]}>☁️</Animated.Text>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, prefix = '', suffix = '', style }: any) {
  const anim = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    return () => anim.removeListener(id);
  }, [value]);

  return (
    <Text style={style}>
      {prefix}{display.toLocaleString('en-IN')}{suffix}
    </Text>
  );
}

// ─── Animated Bar ─────────────────────────────────────────────────────────────
function AnimatedBar({ pct, color }: { pct: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.barTrack}>
      <Animated.View style={[styles.barFill, { width, backgroundColor: color }]} />
    </View>
  );
}

// ─── Farmer Character ─────────────────────────────────────────────────────────
function FarmerCharacter({ dialogue }: { dialogue: string }) {
  const bounceY = useRef(new Animated.Value(0)).current;
  const waveRot = useRef(new Animated.Value(0)).current;
  const blinkOp = useRef(new Animated.Value(1)).current;
  const dlOpacity = useRef(new Animated.Value(0)).current;
  const dlSlide = useRef(new Animated.Value(10)).current;
  const prevDl = useRef('');

  useEffect(() => {
    // bounce
    Animated.loop(Animated.sequence([
      Animated.timing(bounceY, { toValue: -6, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(bounceY, { toValue: 0, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    // wave
    Animated.loop(Animated.sequence([
      Animated.timing(waveRot, { toValue: 1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(waveRot, { toValue: -1, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(waveRot, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.delay(1500),
    ])).start();
    // blink
    Animated.loop(Animated.sequence([
      Animated.delay(3000),
      Animated.timing(blinkOp, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(blinkOp, { toValue: 1, duration: 80, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (dialogue === prevDl.current) return;
    prevDl.current = dialogue;
    dlOpacity.setValue(0); dlSlide.setValue(10);
    Animated.parallel([
      Animated.timing(dlOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(dlSlide, { toValue: 0, duration: 300, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
    ]).start();
  }, [dialogue]);

  const waveRotate = waveRot.interpolate({ inputRange: [-1, 1], outputRange: ['-25deg', '25deg'] });

  return (
    <View style={styles.farmerRow}>
      {/* Character */}
      <Animated.View style={[styles.farmerBody, { transform: [{ translateY: bounceY }] }]}>
        <View style={styles.hatBrim} />
        <View style={styles.hatTop} />
        <Animated.View style={[styles.farmerFace, { opacity: blinkOp }]}>
          <View style={styles.eye} /><View style={styles.eye} />
        </Animated.View>
        <View style={styles.farmerSmile} />
        <View style={styles.shirt}>
          <Animated.View style={[styles.armR, { transform: [{ rotate: waveRotate }] }]} />
          <View style={styles.armL} />
        </View>
      </Animated.View>

      {/* Dialogue */}
      <Animated.View style={[styles.dialogueBubble, { opacity: dlOpacity, transform: [{ translateX: dlSlide }] }]}>
        <Text style={styles.dialogueText}>{dialogue}</Text>
        <View style={styles.dialogueTail} />
      </Animated.View>
    </View>
  );
}

// ─── Crop Card ─────────────────────────────────────────────────────────────────
function CropCard({ crop, isSelected, onPress, disabled }: any) {
  const scale = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.timing(glowAnim, { toValue: isSelected ? 1 : 0, duration: 250, useNativeDriver: false }).start();
    if (isSelected) {
      loopRef.current = Animated.loop(Animated.sequence([
        Animated.timing(floatY, { toValue: -5, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]));
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      Animated.timing(floatY, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [isSelected]);

  const borderColor = glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['#E5E5E5', crop.color] });

  const tap = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[styles.cropWrapper, { transform: [{ scale }, { translateY: floatY }] }]}>
      <TouchableOpacity activeOpacity={1} onPress={tap}>
        <Animated.View style={[styles.cropCard, { borderColor }]}>
          {crop.recommended && (
            <View style={[styles.recommendedBadge, { backgroundColor: crop.color }]}>
              <Text style={styles.recommendedText}>⭐ Recommended</Text>
            </View>
          )}
          <Text style={styles.cropEmoji}>{crop.emoji}</Text>
          <Text style={[styles.cropLabel, isSelected && { color: crop.color }]}>{crop.label}</Text>
          {isSelected && (
            <View style={[styles.cropCheck, { backgroundColor: crop.color }]}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>✓</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Live Farm Preview ────────────────────────────────────────────────────────
function FarmPreview({ crop, budget, weather }: { crop: any; budget: number; weather: typeof WEATHER }) {
  const budgetPct = Math.min((budget - 10000) / 190000, 1);
  const farmScale = 0.6 + budgetPct * 0.4;
  const scaleAnim = useRef(new Animated.Value(farmScale)).current;
  const rainOp = useRef(new Animated.Value(0)).current;
  const rainY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, { toValue: farmScale, friction: 6, useNativeDriver: true }).start();
  }, [farmScale]);

  useEffect(() => {
    if (weather.condition === 'Rainy') {
      Animated.loop(Animated.sequence([
        Animated.timing(rainY, { toValue: 20, duration: 600, useNativeDriver: true }),
        Animated.timing(rainY, { toValue: -10, duration: 0, useNativeDriver: true }),
      ])).start();
      Animated.timing(rainOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } else {
      rainOp.setValue(0);
    }
  }, [weather]);

  const rows = Math.max(2, Math.round(2 + budgetPct * 2));
  const cols = 4;

  return (
    <View style={styles.previewCard}>
      <LinearGradient colors={['#87CEEB', '#A5D6A7']} style={styles.previewGradient}>
        {/* Rain overlay */}
        {weather.condition === 'Rainy' && (
          <Animated.Text style={[styles.rainEmoji, { opacity: rainOp, transform: [{ translateY: rainY }] }]}>
            🌧️
          </Animated.Text>
        )}
        {/* Sunshine */}
        {weather.condition === 'Sunny' && <Text style={styles.previewSun}>🌞</Text>}
        {/* Crop grid */}
        <Animated.View style={[styles.previewFarm, { transform: [{ scale: scaleAnim }] }]}>
          {Array.from({ length: rows }).map((_, r) => (
            <View key={r} style={styles.previewRow}>
              {Array.from({ length: cols }).map((_, c) => (
                <Text key={c} style={styles.previewCropEmoji}>{crop.emoji}</Text>
              ))}
            </View>
          ))}
        </Animated.View>
      </LinearGradient>
      <View style={styles.previewFooter}>
        <Text style={styles.previewLabel}>Live Preview  {weather.emoji} {weather.condition}</Text>
        <Text style={[styles.previewBudget, { color: crop.color }]}>Budget: ₹{(budget / 1000).toFixed(0)}k</Text>
      </View>
    </View>
  );
}

// ─── Insights Panel ───────────────────────────────────────────────────────────
function InsightsPanel({ crop, visible }: { crop: any; visible: boolean }) {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, crop.id]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.insightsPanel, { opacity: opacityAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.insightsTitle}>📊 Live Insights</Text>

      {/* Water */}
      <View style={styles.insightRow}>
        <Text style={styles.insightLabel}>💧 Water Need</Text>
        <Text style={[styles.insightBadge, { backgroundColor: crop.water > 0.7 ? '#29B6F6' : '#A5D6A7' }]}>
          {crop.water > 0.7 ? 'High' : 'Moderate'}
        </Text>
      </View>
      <AnimatedBar pct={crop.water} color="#29B6F6" />

      {/* Profit */}
      <View style={[styles.insightRow, { marginTop: 14 }]}>
        <Text style={styles.insightLabel}>💸 Est. Profit</Text>
        <AnimatedCounter value={crop.profit} prefix="₹" style={[styles.insightBadge, { backgroundColor: '#C8E6C9', color: '#1B5E20' }]} />
      </View>
      <AnimatedBar pct={crop.profit / 100000} color="#58CC02" />

      {/* Risk */}
      <View style={[styles.insightRow, { marginTop: 14 }]}>
        <Text style={styles.insightLabel}>⚠️ Risk Level</Text>
        <Text style={[styles.insightBadge, { backgroundColor: riskColor(crop.risk) + '33', color: riskColor(crop.risk) }]}>
          {crop.risk}
        </Text>
      </View>
      <AnimatedBar pct={crop.risk === 'Low' ? 0.25 : crop.risk === 'Medium' ? 0.6 : 0.9} color={riskColor(crop.risk)} />
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FarmCreationScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [selectedCropId, setSelectedCropId] = useState('Wheat');
  const [farmName, setFarmName] = useState('');
  const [budgetGoal, setBudgetGoal] = useState(50000);
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [hasChosen, setHasChosen] = useState(false);

  const crop = CROPS.find(c => c.id === selectedCropId) || CROPS[0];

  // Farmer dialogue logic
  const getDialogue = useCallback(() => {
    if (!hasChosen) return `Let's build your farm! 🌱\n${WEATHER.emoji} ${WEATHER.condition} this week — good for ${crop.label}!`;
    if (budgetGoal >= 100000) return 'Nice! Bigger budget, better yield 🚜';
    return `Great choice! ${crop.emoji} ${crop.label} is a solid pick!`;
  }, [hasChosen, crop.id, budgetGoal]);

  const [dialogue, setDialogue] = useState(getDialogue());

  useEffect(() => { setDialogue(getDialogue()); }, [getDialogue]);

  const handleSelectCrop = (id: string) => {
    setSelectedCropId(id);
    setHasChosen(true);
  };

  const isValid = farmName.trim().length > 0;

  // CTA button pulse
  const ctaPulse = useRef(new Animated.Value(1)).current;
  const ctaPress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(ctaPulse, { toValue: 1.035, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(ctaPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    if (isValid && !loading) loop.start(); else loop.stop();
    return () => loop.stop();
  }, [isValid, loading]);

  const handleCtaPressIn = () =>
    Animated.spring(ctaPress, { toValue: 0.93, useNativeDriver: true }).start();
  const handleCtaPressOut = () => {
    Animated.spring(ctaPress, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    handleStartSeason();
  };

  // Sparkle animation on farm name typing
  const sparkleOp = useRef(new Animated.Value(0)).current;
  const handleFarmNameChange = (val: string) => {
    setFarmName(val);
    if (val.length > 0) {
      sparkleOp.setValue(1);
      Animated.timing(sparkleOp, { toValue: 0, duration: 800, useNativeDriver: true }).start();
    }
  };

  const handleStartSeason = () => {
    if (loading || !isValid) return;
    setLoading(true);
    setTimeout(() => {
      gameEngine.initGame({
        farm: { name: farmName.trim(), crop: selectedCropId, season: 1 },
        finances: { ...gameEngine.getState().player.finances, cash: budgetGoal },
      });
      const sm = gameEngine.getStateMachine();
      if (sm.getCurrentState() === 'ONBOARDING') {
        sm.transition('FARM_CREATION');
        sm.transition('SEASON_START');
      }
      navigation.replace('Dashboard');
    }, 400);
  };

  // Entrance animation
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[{ flex: 1 }, { opacity: fadeIn }]}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Progress Bar ─────────────────────────────────────── */}
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Step 2 of 3</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '66%' }]} />
              </View>
            </View>

            {/* ── Farmer + Dialogue ─────────────────────────────────── */}
            <FarmerCharacter dialogue={dialogue} />

            {/* ── Weather Hero Card ─────────────────────────────────── */}
            <LinearGradient colors={WEATHER.gradient} style={styles.weatherCard}>
              <Cloud style={styles.cloud1} />
              <Cloud style={styles.cloud2} />
              <View style={styles.weatherContent}>
                <View>
                  <Text style={styles.weatherTemp}>{WEATHER.temp}</Text>
                  <Text style={styles.weatherCondition}>{WEATHER.emoji} {WEATHER.condition}</Text>
                </View>
                <Text style={styles.weatherBigEmoji}>{WEATHER.emoji === '☀️' ? '🌞' : '🌧️'}</Text>
              </View>
              <Text style={styles.weatherHint}>
                {WEATHER.condition === 'Sunny' ? '☀️ Looks sunny this week — great for planting!' : '🌧️ Rain ahead — consider water-heavy crops!'}
              </Text>
            </LinearGradient>

            {/* ── Crop Selection ─────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌱 Choose Your Crop</Text>
              <View style={styles.cropGrid}>
                {CROPS.map(c => (
                  <CropCard
                    key={c.id}
                    crop={c}
                    isSelected={selectedCropId === c.id}
                    onPress={() => handleSelectCrop(c.id)}
                    disabled={loading}
                  />
                ))}
              </View>
            </View>

            {/* ── Insights Panel ─────────────────────────────────────── */}
            <InsightsPanel crop={crop} visible={hasChosen} />

            {/* ── Live Farm Preview ──────────────────────────────────── */}
            <View style={styles.section}>
              <FarmPreview crop={crop} budget={budgetGoal} weather={WEATHER} />
            </View>

            {/* ── Budget Slider ──────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.budgetHeader}>
                <Text style={styles.sectionTitle}>💰 Budget Goal</Text>
                <AnimatedCounter value={budgetGoal} prefix="₹" style={styles.budgetValue} />
              </View>

              <View style={styles.sliderCard}>
                <Slider
                  style={{ width: '100%', height: 44 }}
                  minimumValue={10000}
                  maximumValue={200000}
                  step={5000}
                  value={budgetGoal}
                  onValueChange={v => { setBudgetGoal(v); if (v >= 100000) setDialogue('Nice! Bigger budget, better yield 🚜'); }}
                  minimumTrackTintColor={crop.color}
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#FFC800"
                />
                {/* Milestones */}
                <View style={styles.milestoneRow}>
                  {BUDGET_MILESTONES.map(m => (
                    <View key={m.value} style={styles.milestone}>
                      <Text style={styles.milestoneEmoji}>{m.emoji}</Text>
                      <Text style={[styles.milestoneLabel, budgetGoal >= m.value && { color: crop.color, fontWeight: '800' }]}>
                        {m.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ── Environment Context ────────────────────────────────── */}
            <View style={[styles.section, styles.envCard]}>
              <View style={styles.envItem}>
                <Text style={styles.envEmoji}>🌍</Text>
                <Text style={styles.envLabel}>{SOIL.type}</Text>
                <Text style={styles.envQuality}>({SOIL.quality})</Text>
              </View>
              <View style={styles.envDivider} />
              <View style={styles.envItem}>
                <Text style={styles.envEmoji}>{SOIL.seasonEmoji}</Text>
                <Text style={styles.envLabel}>{SOIL.season}</Text>
                <Text style={styles.envQuality}>(Optimal)</Text>
              </View>
            </View>

            {/* ── Farm Name ─────────────────────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✏️ Name Your Farm</Text>
              <Text style={styles.farmerQuestion}>Farmer Kisan asks: "What should we call your farm?" 🏡</Text>

              <View style={[styles.nameInputContainer, inputFocused && styles.nameInputFocused]}>
                <Text style={styles.nameEmoji}>🌾</Text>
                <TextInput
                  editable={!loading}
                  style={styles.nameInput}
                  placeholder="Enter farm name…"
                  placeholderTextColor="#BDBDBD"
                  value={farmName}
                  onChangeText={handleFarmNameChange}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  maxLength={30}
                />
                <Animated.Text style={[styles.sparkle, { opacity: sparkleOp }]}>✨</Animated.Text>
              </View>
            </View>

            {/* ── Spacer for sticky button ───────────────────────────── */}
            <View style={{ height: 110 }} />
          </ScrollView>

          {/* ── Sticky CTA ──────────────────────────────────────────── */}
          <View style={styles.stickyBottom}>
            <Animated.View style={{ transform: [{ scale: Animated.multiply(ctaPulse, ctaPress) }] }}>
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={handleCtaPressIn}
                onPressOut={handleCtaPressOut}
                disabled={!isValid || loading}
                style={[styles.ctaButton, (!isValid || loading) && styles.ctaButtonDisabled]}
              >
                <LinearGradient
                  colors={isValid && !loading ? ['#58CC02', '#46A302'] : ['#CFD8DC', '#B0BEC5']}
                  style={styles.ctaGradient}
                >
                  <Text style={[styles.ctaText, (!isValid || loading) && styles.ctaTextDisabled]}>
                    {loading ? 'Setting up your farm… 🚜' : 'Start Farming 🚜'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78909C',
    minWidth: 70,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C8E6C9',
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#58CC02',
  },

  // Farmer
  farmerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  farmerBody: {
    alignItems: 'center',
  },
  hatTop: {
    width: 36,
    height: 22,
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  hatBrim: {
    width: 52,
    height: 9,
    backgroundColor: '#388E3C',
    borderRadius: 4,
  },
  farmerFace: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFCC80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#FFA726',
  },
  eye: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#4E342E',
  },
  farmerSmile: {
    width: 24,
    height: 12,
    borderRadius: 12,
    borderBottomWidth: 3,
    borderColor: '#E65100',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    marginTop: -4,
    alignSelf: 'center',
  },
  shirt: {
    width: 60,
    height: 42,
    backgroundColor: '#1565C0',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  armR: {
    width: 15,
    height: 32,
    backgroundColor: '#FFCC80',
    borderRadius: 8,
    marginTop: 6,
    marginLeft: -5,
  },
  armL: {
    width: 15,
    height: 32,
    backgroundColor: '#FFCC80',
    borderRadius: 8,
    marginTop: 6,
    marginRight: -5,
  },
  dialogueBubble: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 60,
    justifyContent: 'center',
  },
  dialogueText: {
    fontSize: 14,
    color: '#37474F',
    fontWeight: '600',
    lineHeight: 21,
  },
  dialogueTail: {
    position: 'absolute',
    left: -10,
    top: 18,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#FFFFFF',
  },

  // Weather
  weatherCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
    minHeight: 110,
  },
  weatherContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherTemp: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  weatherCondition: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    marginTop: 2,
  },
  weatherBigEmoji: {
    fontSize: 52,
  },
  weatherHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  cloud1: {
    position: 'absolute',
    top: 10,
    left: -80,
    fontSize: 28,
    opacity: 0.5,
  },
  cloud2: {
    position: 'absolute',
    top: 30,
    left: -80,
    fontSize: 20,
    opacity: 0.35,
  },

  // Sections
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2E3A23',
    marginBottom: 14,
  },

  // Crop cards
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cropWrapper: {
    width: (W - 52) / 2,
  },
  cropCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2.5,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cropEmoji: {
    fontSize: 34,
    marginBottom: 8,
  },
  cropLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#546E7A',
  },
  cropCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Insights Panel
  insightsPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 14,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#546E7A',
  },
  insightBadge: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    color: '#1B5E20',
    overflow: 'hidden',
  },
  barTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ECEFF1',
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },

  // Farm Preview
  previewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 4,
  },
  previewGradient: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewSun: {
    position: 'absolute',
    top: 10,
    right: 16,
    fontSize: 32,
  },
  rainEmoji: {
    position: 'absolute',
    top: 10,
    right: 16,
    fontSize: 32,
  },
  previewFarm: {
    alignItems: 'center',
    gap: 4,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 6,
  },
  previewCropEmoji: {
    fontSize: 22,
  },
  previewFooter: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78909C',
  },
  previewBudget: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Budget
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1B5E20',
  },
  sliderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  milestone: {
    alignItems: 'center',
  },
  milestoneEmoji: {
    fontSize: 18,
  },
  milestoneLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#90A4AE',
    marginTop: 2,
  },

  // Environment
  envCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  envItem: {
    alignItems: 'center',
    gap: 4,
  },
  envEmoji: {
    fontSize: 28,
  },
  envLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#37474F',
  },
  envQuality: {
    fontSize: 12,
    fontWeight: '600',
    color: '#58CC02',
  },
  envDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E0E0E0',
  },

  // Farm Name
  farmerQuestion: {
    fontSize: 14,
    color: '#78909C',
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 4,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  nameInputFocused: {
    borderColor: '#58CC02',
    backgroundColor: '#F1F8E9',
  },
  nameEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#263238',
    paddingVertical: 16,
  },
  sparkle: {
    fontSize: 24,
    marginLeft: 8,
  },

  // CTA
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: 'rgba(241,248,233,0.97)',
    borderTopWidth: 1.5,
    borderTopColor: '#C8E6C9',
  },
  ctaButton: {
    borderRadius: 18,
    overflow: 'hidden',
    borderBottomWidth: 5,
    borderBottomColor: '#388E3C',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaButtonDisabled: {
    borderBottomColor: '#B0BEC5',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaGradient: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  ctaTextDisabled: {
    color: '#78909C',
  },
});
