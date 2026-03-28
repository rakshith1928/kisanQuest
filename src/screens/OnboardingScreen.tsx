import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Animated, KeyboardAvoidingView, Platform, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import gameEngine from '../engine/GameEngine';
import VoiceManager from '../voice/VoiceManager';
import { TranslatedText } from '../components/TranslatedText';
import { GameStateDB } from '../storage/GameStateDB';

const LANGUAGES = [
  { id: 'hi', name: 'हिंदी' },
  { id: 'en', name: 'English' },
  { id: 'mr', name: 'मराठी' },
  { id: 'ta', name: 'தமிழ்' },
  { id: 'te', name: 'తెలుగు' },
  { id: 'kn', name: 'ಕನ್ನಡ' },
  { id: 'bn', name: 'বাংলা' },
  { id: 'gu', name: 'ગુજરાતી' },
  { id: 'pa', name: 'ਪੰਜਾਬੀ' },
  { id: 'or', name: 'ଓଡ଼ିଆ' },
];

const LanguagePill = ({ lang, isSelected, onPress }: any) => {
  const scaleValue = useRef(new Animated.Value(isSelected ? 1.05 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: isSelected ? 1.05 : 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: isSelected ? 1.05 : 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.langPill, isSelected && styles.langPillSelected]}
      >
        <Text style={[styles.langText, isSelected && styles.langTextSelected]}>
          {lang.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const MicButton = ({ isListening, onPress, feedbackText }: any) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation;
    if (isListening) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      );
      loop.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
    return () => loop && loop.stop();
  }, [isListening]);

  return (
    <View style={styles.micContainer}>
      <Animated.View style={[styles.micButtonWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonListening]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Ionicons name={isListening ? "mic" : "mic-outline"} size={28} color="#fff" />
          <Text style={styles.micButtonText}>
            {isListening ? 'Listening...' : 'Tap to Speak'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.micFeedbackText}>{feedbackText}</Text>
    </View>
  );
};

export default function OnboardingScreen({ navigation }: any) {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<string>(i18n.language || 'hi');
  const [playerName, setPlayerName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [feedbackText, setFeedbackText] = useState("Tap the mic and speak your choice");

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const isNameValid = playerName.trim().length > 0;

  const handleSpeak = async (isRetry = false) => {
    if (isListening) return;
    setIsListening(true);
    setFeedbackText("Listening...");

    try {
      const action = await VoiceManager.listenForDuration(3000);
      
      if (!action) {
        if (!isRetry) {
          setFeedbackText("Didn't catch that, trying again...");
          setIsListening(false);
          // Auto retry once
          setTimeout(() => handleSpeak(true), 1000);
          return;
        } else {
          setFeedbackText("Didn't catch that, please try again");
          await VoiceManager.speak("Sorry, I didn't understand. Please try again.");
          setIsListening(false);
          return;
        }
      }

      const actionToLangMap: Record<string, { id: string, name: string }> = {
        SELECT_HINDI: { id: 'hi', name: 'Hindi' },
        SELECT_ENGLISH: { id: 'en', name: 'English' },
        SELECT_MARATHI: { id: 'mr', name: 'Marathi' },
      };

      const match = actionToLangMap[action];
      if (match) {
        setSelectedLang(match.id);
        i18n.changeLanguage(match.id);
        setFeedbackText(`Selected ${match.name}`);
        await VoiceManager.speak(`${match.name} selected`);
      } else {
        setFeedbackText("Language not recognized. Try again.");
      }
    } catch (err) {
      console.error('VoiceManager Error:', err);
      setFeedbackText("Error listening. Please try again.");
    } finally {
      setIsListening(false);
    }
  };

  const handleStartGame = async () => {
    if (!selectedLang || !isNameValid || loading) return;
    setLoading(true);

    try {
      // Initialize engine with selected language
      gameEngine.initGame({ language: selectedLang });

      const trimmedName = playerName.trim();
      let playerId = trimmedName;

      try {
        const { authService } = require('../services/authService');
        const result = await Promise.race([
          authService.register(trimmedName, selectedLang, 'Unknown'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Network Timeout')), 15000))
        ]) as any;
        // Use server-assigned ID if available
        if (result?.id) playerId = result.id;
      } catch (err) {
        console.warn('Backend register failed or timed out, continuing offline:', err);
      }

      // Persist player ID for future session restores
      await AsyncStorage.setItem('playerId', playerId);

      // Check for an existing saved state (returning player)
      try {
        const savedState = await GameStateDB.loadGameState(playerId);
        if (savedState?.player) {
          gameEngine.loadState(savedState);
          console.log(`[Onboarding] Resumed saved game for: ${playerId}`);
        }
      } catch (dbErr) {
        console.warn('Could not load game state from DB:', dbErr);
      }

      setTimeout(() => {
        navigation.replace('FarmCreation');
      }, 200);
    } catch (err) {
      console.error("Critical error starting game:", err);
      alert("Failed to start game. Please try again.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView 
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.titleContainer}>
              <TranslatedText tKey="ui.onboarding.select_language" style={styles.title} />
              <Text style={styles.subtitle}>Choose your preferred language to learn and play.</Text>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.langScroll}
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
            >
              {LANGUAGES.map((lang) => (
                <LanguagePill
                  key={lang.id}
                  lang={lang}
                  isSelected={selectedLang === lang.id}
                  onPress={() => {
                    setSelectedLang(lang.id);
                    i18n.changeLanguage(lang.id);
                  }}
                />
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>What is your name?</Text>
            <View style={[styles.inputContainer, inputFocused && styles.inputContainerFocused]}>
              <TextInput
                editable={!loading}
                style={styles.input}
                placeholder="e.g., Rahul"
                placeholderTextColor="#AFAFAF"
                value={playerName}
                onChangeText={setPlayerName}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
            </View>

            <MicButton 
              isListening={isListening} 
              onPress={() => handleSpeak(false)} 
              feedbackText={feedbackText} 
            />

          </ScrollView>

          <View style={styles.stickyBottom}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.startButton,
                (!isNameValid || loading) && styles.startButtonDisabled
              ]}
              onPress={handleStartGame}
              disabled={!isNameValid || loading}
            >
              <Text style={[
                styles.startButtonText,
                (!isNameValid || loading) && styles.startButtonTextDisabled
              ]}>
                {loading ? 'Starting...' : t('ui.start_game')}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 140, // Space for sticky bottom button
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4B4B4B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#AFAFAF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4B4B4B',
    marginBottom: 16,
    marginTop: 32,
  },
  langScroll: {
    marginLeft: -24,
    marginRight: -24,
    height: 70, // Fixed height to prevent clipping box shadow during animation
  },
  langPill: {
    backgroundColor: '#E5E5E5',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginRight: 12,
    borderBottomWidth: 4,
    borderBottomColor: '#D4D4D4',
    borderWidth: 2,
    borderColor: 'transparent',
    height: 54,
    justifyContent: 'center',
  },
  langPillSelected: {
    backgroundColor: '#58CC02',
    borderBottomColor: '#46A302',
    borderColor: '#58CC02',
  },
  langText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#777777',
  },
  langTextSelected: {
    color: '#FFFFFF',
  },
  inputContainer: {
    backgroundColor: '#F3F3F3',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
  },
  inputContainerFocused: {
    backgroundColor: '#E5F3FF',
    borderColor: '#1CB0F6',
  },
  input: {
    fontSize: 18,
    color: '#4B4B4B',
    paddingVertical: 14,
    fontWeight: '600',
  },
  micContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  micButtonWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#58CC02',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '85%',
    borderBottomWidth: 4,
    borderBottomColor: '#46A302',
  },
  micButtonListening: {
    backgroundColor: '#FF4B4B',
    borderBottomColor: '#CC3C3C',
  },
  micButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  micFeedbackText: {
    color: '#AFAFAF',
    fontSize: 14,
    marginTop: 16,
    fontWeight: '600',
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 2,
    borderTopColor: '#E5E5E5',
  },
  startButton: {
    backgroundColor: '#58CC02',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#46A302',
  },
  startButtonDisabled: {
    backgroundColor: '#E5E5E5',
    borderBottomColor: '#D4D4D4',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  startButtonTextDisabled: {
    color: '#AFAFAF',
  }
});

