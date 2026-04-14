import React, { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import gameEngine from '../engine/GameEngine';
import VoiceManager from '../voice/VoiceManager';
import { GameStateDB } from '../storage/GameStateDB';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇬🇧' },
  { id: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { id: 'mr', name: 'मराठी', flag: '🌾' },
  { id: 'ta', name: 'தமிழ்', flag: '🌻' },
  { id: 'te', name: 'తెలుగు', flag: '🌿' },
  { id: 'kn', name: 'ಕನ್ನಡ', flag: '🎋' },
  { id: 'bn', name: 'বাংলা', flag: '🌺' },
  { id: 'gu', name: 'ગુજરાતી', flag: '🌼' },
  { id: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🌾' },
  { id: 'or', name: 'ଓଡ଼ିଆ', flag: '🌱' },
];

// ─── react-native-confetti-cannon wrapper ────────────────────────────────────
function ConfettiLauncher({ cannonRef }: { cannonRef: RefObject<any> }) {
  return (
    <ConfettiCannon
      ref={cannonRef}
      count={80}
      origin={{ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT * 0.5 }}
      autoStart={false}
      fadeOut
      fallSpeed={2500}
      colors={['#58CC02', '#FFD700', '#FF6B6B', '#4FC3F7', '#CE93D8', '#80CBC4', '#FFA726']}
    />
  );
}

// ─── Floating Sparkle ────────────────────────────────────────────────────────
function FloatingSparkle({ emoji, style }: { emoji: string; style: any }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -12,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  return (
    <Animated.Text style={[style, { transform: [{ translateY: floatAnim }] }]}>
      {emoji}
    </Animated.Text>
  );
}

// ─── Farmer Character ────────────────────────────────────────────────────────
function FarmerCharacter({ reactionText }: { reactionText?: string }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const reactionOpacity = useRef(new Animated.Value(0)).current;
  const reactionScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: -1,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (reactionText) {
      reactionOpacity.setValue(0);
      reactionScale.setValue(0.5);
      Animated.parallel([
        Animated.spring(reactionOpacity, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(reactionScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
      const t = setTimeout(() => {
        Animated.timing(reactionOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [reactionText]);

  const waveRotate = waveAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-20deg', '20deg'],
  });

  return (
    <Animated.View style={[styles.farmerWrapper, { transform: [{ translateY: bounceAnim }] }]}>
      {reactionText ? (
        <Animated.View
          style={[
            styles.reactionBubble,
            { opacity: reactionOpacity, transform: [{ scale: reactionScale }] },
          ]}
        >
          <Text style={styles.reactionText}>{reactionText}</Text>
        </Animated.View>
      ) : null}
      <View style={styles.farmerBody}>
        {/* Hat */}
        <View style={styles.hatBrim} />
        <View style={styles.hatTop} />
        {/* Face */}
        <View style={styles.farmerFace}>
          <View style={styles.eye} />
          <View style={styles.eye} />
        </View>
        <View style={styles.farmerSmile} />
        {/* Shirt */}
        <View style={styles.shirt}>
          {/* Wave arm */}
          <Animated.View
            style={[styles.armRight, { transform: [{ rotate: waveRotate }] }]}
          />
          <View style={styles.armLeft} />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Typing Dialogue Bubble ───────────────────────────────────────────────────
function DialogueBubble({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = async () => {
    if (isPlaying) {
      VoiceManager.stopSpeaking();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    await VoiceManager.speak(text);
    setIsPlaying(false);
  };

  useEffect(() => {
    setDisplayed('');
    slideAnim.setValue(20);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <Animated.View
      style={[
        styles.dialogueBubble,
        { flexDirection: 'row', alignItems: 'center', transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      <Text style={[styles.dialogueText, { flex: 1 }]}>{displayed}</Text>
      <TouchableOpacity onPress={handleSpeak} style={{ marginLeft: 8, padding: 4 }}>
        <Ionicons name={isPlaying ? "volume-high" : "volume-medium-outline"} size={22} color="#58CC02" />
      </TouchableOpacity>
      <View style={styles.dialogueTail} />
    </Animated.View>
  );
}

// ─── Language Card ────────────────────────────────────────────────────────────
function LanguageCard({ lang, isSelected, onPress }: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.06 : 1,
      friction: 4,
      tension: 120,
      useNativeDriver: true,
    }).start();
    Animated.timing(glowAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E5E5', '#58CC02'],
  });

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.06 : 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity activeOpacity={1} onPress={handlePress}>
        <Animated.View
          style={[
            styles.languageCard,
            {
              borderColor,
              backgroundColor: isSelected ? '#F0FFF0' : '#FAFAFA',
            },
          ]}
        >
          <Text style={styles.languageFlag}>{lang.flag}</Text>
          <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
            {lang.name}
          </Text>
          {isSelected && (
            <View style={styles.checkmark}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>✓</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Pulsing Button ───────────────────────────────────────────────────────────
function PulsingButton({ label, onPress, disabled }: any) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (disabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [disabled]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, { toValue: 0.94, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(pressAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: Animated.multiply(pulseAnim, pressAnim) }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.ctaButton, disabled && styles.ctaButtonDisabled]}
      >
        <Text style={[styles.ctaButtonText, disabled && styles.ctaButtonTextDisabled]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.dot, i <= current && styles.dotActive, i === current && styles.dotCurrent]}
        />
      ))}
    </View>
  );
}

import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState<string>(i18n.language || 'hi');
  const [playerName, setPlayerName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [farmerReaction, setFarmerReaction] = useState<string | undefined>();
  const [inputFocused, setInputFocused] = useState(false);
  const cannonRef = useRef<any>(null);

  // Step transition animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Splash logo bounce
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Greeting text
  const greetingSlide = useRef(new Animated.Value(30)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;

  // ── Splash animation + auto-advance ──────────────────────────────────────
  useEffect(() => {
    if (step !== 0) return;
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => transitionTo(1), 2200);
    return () => clearTimeout(timer);
  }, []);

  // ── Greeting animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 4) return;
    greetingSlide.setValue(30);
    greetingOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(greetingSlide, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.back(1.3)),
        useNativeDriver: true,
      }),
      Animated.timing(greetingOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  const transitionTo = useCallback(
    (nextStep: number) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -40,
          duration: 220,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setStep(nextStep);
        slideAnim.setValue(40);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [fadeAnim, slideAnim]
  );

  const handleSelectLanguage = (langId: string) => {
    setSelectedLang(langId);
    i18n.changeLanguage(langId);
    setFarmerReaction(t('ui.onboarding.reaction_great_choice'));
  };

  const handleNameConfirm = () => {
    if (playerName.trim().length === 0) return;
    cannonRef.current?.start();
    setFarmerReaction(t('ui.onboarding.reaction_lovely_name'));
    setTimeout(() => transitionTo(4), 1000);
  };

  const handleSpeak = async () => {
    if (isListening) return;
    setIsListening(true);
    try {
      const action = await VoiceManager.listenForDuration(3000);
      const map: Record<string, string> = {
        SELECT_HINDI: 'hi',
        SELECT_ENGLISH: 'en',
        SELECT_MARATHI: 'mr',
      };
      if (action && map[action]) {
        setSelectedLang(map[action]);
        i18n.changeLanguage(map[action]);
        setFarmerReaction(t('ui.onboarding.reaction_great_choice'));
      } else {
        setFarmerReaction(t('ui.onboarding.error_mic_clear'));
      }
    } catch (_) {
      setFarmerReaction(t('ui.onboarding.error_mic_general'));
    }
    finally { setIsListening(false); }
  };

  const handleStartGame = async () => {
    if (!selectedLang || !playerName.trim() || loading) return;
    setLoading(true);
    try {
      gameEngine.initGame({ language: selectedLang });
      const trimmedName = playerName.trim();
      let playerId = trimmedName;
      try {
        const { authService } = require('../services/authService');
        const result = await Promise.race([
          authService.register(trimmedName, selectedLang, 'Unknown'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000)),
        ]) as any;
        if (result?.id) playerId = result.id;
      } catch (err) {
        console.warn('Backend register failed, continuing offline:', err);
      }
      await AsyncStorage.setItem('playerId', playerId);
      try {
        const savedState = await GameStateDB.loadGameState(playerId);
        if (savedState?.player) {
          gameEngine.loadState(savedState);
        }
      } catch (_) {}
      setTimeout(() => navigation.replace('FarmCreation'), 200);
    } catch (err) {
      alert('Failed to start game. Please try again.');
      setLoading(false);
    }
  };

  // ─── Render Steps ───────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── Step 0: Splash ──────────────────────────────────────────────────────
      case 0:
        return (
          <LinearGradient colors={['#2E7D32', '#1565C0', '#0D47A1']} style={styles.fill}>
            <FloatingSparkle emoji="🌿" style={styles.sparkle1} />
            <FloatingSparkle emoji="⭐" style={styles.sparkle2} />
            <FloatingSparkle emoji="🌾" style={styles.sparkle3} />
            <FloatingSparkle emoji="✨" style={styles.sparkle4} />

            <Animated.View
              style={[
                styles.splashLogoContainer,
                { opacity: logoOpacity, transform: [{ scale: logoScale }] },
              ]}
            >
              <View style={styles.logoCircle}>
                <Text style={styles.logoEmoji}>🌱</Text>
              </View>
              <Text style={styles.splashTitle}>KisanQuest</Text>
              <Text style={styles.splashSubtitle}>{t('ui.onboarding.splash_subtitle')}</Text>
            </Animated.View>
          </LinearGradient>
        );

      // ── Step 1: Welcome Character ───────────────────────────────────────────
      case 1:
        return (
          <LinearGradient colors={['#E8F5E9', '#E3F2FD']} style={styles.fill}>
            <View style={styles.farmBackground}>
              <LinearGradient colors={['#87CEEB', '#B3E5FC']} style={styles.sky} />
              <View style={styles.groundRow}>
                <Text style={styles.treeEmoji}>🌳</Text>
                <View style={styles.grassStrip} />
                <Text style={styles.treeEmoji}>🌳</Text>
              </View>
              <FloatingSparkle emoji="☀️" style={styles.sun} />
            </View>
            <View style={styles.characterArea}>
              <DialogueBubble text={t('ui.onboarding.hi_kisan')} />
              <FarmerCharacter reactionText={farmerReaction} />
            </View>
            <View style={styles.stepFooter}>
              <PulsingButton label={t('ui.onboarding.lets_go')} onPress={() => transitionTo(2)} disabled={false} />
            </View>
          </LinearGradient>
        );

      // ── Step 2: Language Selection ──────────────────────────────────────────
      case 2:
        return (
          <LinearGradient colors={['#F1F8E9', '#E8F5E9']} style={styles.fill}>
            <View style={styles.stepHeader}>
              <FarmerCharacter reactionText={farmerReaction} />
              <DialogueBubble text={t('ui.onboarding.select_language')} />
            </View>

            <ScrollView
              contentContainerStyle={styles.langGrid}
              showsVerticalScrollIndicator={false}
            >
              {LANGUAGES.map((lang) => (
                <LanguageCard
                  key={lang.id}
                  lang={lang}
                  isSelected={selectedLang === lang.id}
                  onPress={() => handleSelectLanguage(lang.id)}
                />
              ))}
            </ScrollView>

            <View style={styles.micRow}>
              <TouchableOpacity
                style={[styles.micChip, isListening && styles.micChipActive]}
                onPress={handleSpeak}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isListening ? 'mic' : 'mic-outline'}
                  size={18}
                  color={isListening ? '#fff' : '#58CC02'}
                />
                <Text style={[styles.micChipText, isListening && { color: '#fff' }]}>
                  {isListening ? t('ui.onboarding.listening') : t('ui.onboarding.speak_to_select')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.stepFooter}>
              <PulsingButton
                label={t('ui.onboarding.next')}
                onPress={() => transitionTo(3)}
                disabled={!selectedLang}
              />
            </View>
          </LinearGradient>
        );

      // ── Step 3: Name Input ──────────────────────────────────────────────────
      case 3:
        return (
          <LinearGradient colors={['#FFF8E1', '#FFF3E0']} style={styles.fill}>
            <KeyboardAvoidingView
              style={styles.fill}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View style={styles.stepHeader}>
                <FarmerCharacter reactionText={farmerReaction} />
                <DialogueBubble text={t('ui.onboarding.ask_name')} />
              </View>

              <View style={styles.nameInputArea}>
                <Text style={styles.nameLabel}>{t('ui.onboarding.your_name')}</Text>
                <View
                  style={[
                    styles.nameInputContainer,
                    inputFocused && styles.nameInputFocused,
                  ]}
                >
                  <Text style={styles.nameInputEmoji}>👤</Text>
                  <TextInput
                    style={styles.nameInput}
                    placeholder={t('ui.onboarding.type_name')}
                    placeholderTextColor="#BDBDBD"
                    value={playerName}
                    onChangeText={setPlayerName}
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                    returnKeyType="done"
                    onSubmitEditing={handleNameConfirm}
                    autoFocus
                    maxLength={24}
                  />
                </View>
                {playerName.trim().length > 0 && (
                  <Text style={styles.nameCount}>{playerName.trim().length}/24</Text>
                )}
              </View>

              <ConfettiLauncher cannonRef={cannonRef} />

              <View style={styles.stepFooter}>
                <PulsingButton
                  label={t('ui.onboarding.thats_me')}
                  onPress={handleNameConfirm}
                  disabled={playerName.trim().length === 0}
                />
              </View>
            </KeyboardAvoidingView>
          </LinearGradient>
        );

      // ── Step 4: Personalized Greeting ───────────────────────────────────────
      case 4:
        return (
          <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.fill}>
            <View style={styles.farmBackground}>
              <LinearGradient colors={['#87CEEB', '#B3E5FC']} style={styles.sky} />
              <FloatingSparkle emoji="☀️" style={styles.sun} />
            </View>
            <View style={styles.greetingArea}>
              <FarmerCharacter />
              <Animated.Text
                style={[
                  styles.greetingName,
                  {
                    opacity: greetingOpacity,
                    transform: [{ translateY: greetingSlide }],
                  },
                ]}
              >
                {t('ui.onboarding.hi_player', { name: playerName })}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.greetingSubtitle,
                  {
                    opacity: greetingOpacity,
                    transform: [{ translateY: greetingSlide }],
                  },
                ]}
              >
                {t('ui.onboarding.ready_adventure')}
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.greetingCta,
                  {
                    opacity: greetingOpacity,
                  },
                ]}
              >
                {t('ui.onboarding.build_together')}
              </Animated.Text>
            </View>
            <View style={styles.stepFooter}>
              <PulsingButton label={t('ui.onboarding.show_me')} onPress={() => transitionTo(5)} disabled={false} />
            </View>
          </LinearGradient>
        );

      // ── Step 5: CTA ─────────────────────────────────────────────────────────
      case 5:
        return (
          <LinearGradient colors={['#1B5E20', '#2E7D32', '#388E3C']} style={styles.fill}>
            <FloatingSparkle emoji="🌾" style={styles.sparkle1} />
            <FloatingSparkle emoji="⭐" style={styles.sparkle2} />
            <FloatingSparkle emoji="🌻" style={styles.sparkle3} />
            <FloatingSparkle emoji="🌿" style={styles.sparkle4} />

            <View style={styles.ctaArea}>
              <Text style={styles.ctaBigEmoji}>🏆</Text>
              <Text style={styles.ctaTitle}>
                {t('ui.onboarding.fields_await', { name: playerName })}
              </Text>
              <Text style={styles.ctaSubtitle}>
                {t('ui.onboarding.cta_subtitle')}
              </Text>
            </View>

            <View style={styles.ctaButtonWrapper}>
              <PulsingButton
                label={loading ? t('ui.onboarding.starting') : t('ui.onboarding.lets_start')}
                onPress={handleStartGame}
                disabled={loading}
              />
            </View>
          </LinearGradient>
        );

      default:
        return null;
    }
  };

  // Total steps excluding splash (for progress dots: steps 1–5)
  const showDots = step >= 1;
  const dotIndex = step - 1;

  return (
    <SafeAreaView style={styles.container}>
      {showDots && step < 5 && (
        <View style={styles.dotsWrapper}>
          <ProgressDots total={4} current={dotIndex} />
        </View>
      )}
      <Animated.View
        style={[
          styles.fill,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {renderStep()}
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E20',
  },
  fill: {
    flex: 1,
  },

  // ── Progress dots
  dotsWrapper: {
    position: 'absolute',
    top: 16,
    width: '100%',
    zIndex: 100,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotCurrent: {
    width: 24,
    backgroundColor: '#58CC02',
  },

  // ── Splash
  splashLogoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  logoEmoji: {
    fontSize: 64,
  },
  splashTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  splashSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Floating elements
  sparkle1: {
    position: 'absolute',
    top: '12%',
    left: '8%',
    fontSize: 28,
    opacity: 0.8,
  },
  sparkle2: {
    position: 'absolute',
    top: '20%',
    right: '10%',
    fontSize: 22,
    opacity: 0.7,
  },
  sparkle3: {
    position: 'absolute',
    bottom: '22%',
    left: '12%',
    fontSize: 26,
    opacity: 0.75,
  },
  sparkle4: {
    position: 'absolute',
    bottom: '15%',
    right: '8%',
    fontSize: 20,
    opacity: 0.65,
  },
  sun: {
    position: 'absolute',
    top: 20,
    right: 30,
    fontSize: 36,
  },

  // ── Farm background
  farmBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.35,
  },
  sky: {
    flex: 1,
  },
  groundRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  treeEmoji: {
    fontSize: 40,
  },
  grassStrip: {
    flex: 1,
    height: 20,
    backgroundColor: '#558B2F',
    borderRadius: 4,
    marginHorizontal: 4,
  },

  // ── Step layout
  stepHeader: {
    marginTop: SCREEN_HEIGHT * 0.1,
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  stepFooter: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
  },

  // ── Character area (welcome)
  characterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SCREEN_HEIGHT * 0.12,
    paddingHorizontal: 24,
  },

  // ── Farmer character (drawn)
  farmerWrapper: {
    alignItems: 'center',
    marginBottom: 8,
  },
  farmerBody: {
    alignItems: 'center',
  },
  hatTop: {
    width: 44,
    height: 26,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginBottom: 0,
  },
  hatBrim: {
    width: 64,
    height: 10,
    backgroundColor: '#388E3C',
    borderRadius: 4,
    marginBottom: 0,
  },
  farmerFace: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFCC80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: '#FFA726',
  },
  eye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4E342E',
  },
  farmerSmile: {
    width: 28,
    height: 14,
    borderRadius: 14,
    borderBottomWidth: 3,
    borderColor: '#E65100',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    marginTop: -4,
    alignSelf: 'center',
  },
  shirt: {
    width: 70,
    height: 50,
    backgroundColor: '#1565C0',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 0,
  },
  armRight: {
    width: 18,
    height: 38,
    backgroundColor: '#FFCC80',
    borderRadius: 9,
    marginTop: 8,
    marginLeft: -6,
  },
  armLeft: {
    width: 18,
    height: 38,
    backgroundColor: '#FFCC80',
    borderRadius: 9,
    marginTop: 8,
    marginRight: -6,
  },

  // ── Reaction bubble
  reactionBubble: {
    backgroundColor: '#FFF9C4',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#F9A825',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  reactionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F57F17',
  },

  // ── Dialogue bubble
  dialogueBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    maxWidth: SCREEN_WIDTH * 0.82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  dialogueText: {
    fontSize: 17,
    color: '#37474F',
    fontWeight: '600',
    lineHeight: 24,
  },
  dialogueTail: {
    position: 'absolute',
    bottom: -12,
    left: '45%',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 13,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },

  // ── Language grid
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  languageCard: {
    width: (SCREEN_WIDTH - 72) / 2,
    borderRadius: 16,
    borderWidth: 2.5,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  languageFlag: {
    fontSize: 28,
    marginBottom: 6,
  },
  languageName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#546E7A',
    textAlign: 'center',
  },
  languageNameSelected: {
    color: '#2E7D32',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#58CC02',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Mic chip
  micRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  micChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#58CC02',
  },
  micChipActive: {
    backgroundColor: '#FF5252',
    borderColor: '#D32F2F',
  },
  micChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },

  // ── Name input
  nameInputArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: SCREEN_HEIGHT * 0.12,
  },
  nameLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78909C',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  nameInputFocused: {
    borderColor: '#58CC02',
    backgroundColor: '#F1F8E9',
  },
  nameInputEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  nameInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#263238',
    paddingVertical: 16,
  },
  nameCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#90A4AE',
    marginTop: 6,
    fontWeight: '600',
  },

  // ── Greeting
  greetingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    marginTop: SCREEN_HEIGHT * 0.15,
  },
  greetingName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1B5E20',
    textAlign: 'center',
    marginTop: 20,
  },
  greetingSubtitle: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 26,
  },
  greetingCta: {
    fontSize: 15,
    color: '#558B2F',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 20,
  },

  // ── CTA screen
  ctaArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  ctaBigEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 34,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 14,
    lineHeight: 24,
  },
  ctaButtonWrapper: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },

  // ── CTA button (used in all steps via PulsingButton)
  ctaButton: {
    backgroundColor: '#58CC02',
    borderRadius: 18,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 5,
    borderBottomColor: '#46A302',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonDisabled: {
    backgroundColor: '#CFD8DC',
    borderBottomColor: '#B0BEC5',
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ctaButtonTextDisabled: {
    color: '#90A4AE',
  },
});
