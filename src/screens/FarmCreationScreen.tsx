import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Animated, KeyboardAvoidingView, Platform, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next';
import { TranslatedText } from '../components/TranslatedText';
import gameEngine from '../engine/GameEngine';

const CROPS = ['Rice', 'Wheat', 'Cotton', 'Sugarcane'];

const CropCard = ({ crop, isSelected, onPress }: any) => {
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
    <Animated.View style={[styles.cropCardWrapper, { transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.cropCard, isSelected && styles.cropCardSelected]}
      >
        <Text style={[styles.cropText, isSelected && styles.cropTextSelected]}>{crop}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function FarmCreationScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [selectedCrop, setSelectedCrop] = useState<string>('Rice');
  const [farmName, setFarmName] = useState('');
  const [budgetGoal, setBudgetGoal] = useState<number>(50000);
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Duolingo style bouncy intro animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const isValidName = farmName.trim().length > 0;

  const handleStartSeason = () => {
    if (loading) return;
    if (!isValidName) return;
    setLoading(true);

    // Simulate slight setup delay for smoother UX
    setTimeout(() => {
      gameEngine.initGame({
        farm: {
          name: farmName.trim(),
          crop: selectedCrop,
          season: 1, 
        },
        finances: {
          ...gameEngine.getState().player.finances,
          cash: budgetGoal
        }
      });

      // Crucial Fix: Push the state machine into the actual game loop for a new farm!
      const sm = gameEngine.getStateMachine();
      if(sm.getCurrentState() === 'ONBOARDING'){
          sm.transition('FARM_CREATION');
          sm.transition('SEASON_START');
      }

      navigation.replace('Dashboard');
    }, 400);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <ScrollView 
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TranslatedText tKey="ui.farm_creation.title" style={styles.title} />
              <Text style={styles.subtitle}>Choose your strategy for this season</Text>
              
              {/* Animated Strategy Card replacing the gray box */}
              <View style={styles.strategyCard}>
                <View style={styles.strategyIconPlaceholder}>
                  <Text style={{ fontSize: 40 }}>🚜</Text>
                </View>
                <Text style={styles.strategyText}>Plan smarter, harvest better!</Text>
              </View>
            </View>

            <View style={styles.section}>
              <TranslatedText tKey="ui.farm_creation.select_crop" style={styles.sectionTitle} />
              <View style={styles.grid}>
                {CROPS.map((crop) => (
                  <CropCard
                    key={crop}
                    crop={crop}
                    isSelected={selectedCrop === crop}
                    onPress={() => !loading && setSelectedCrop(crop)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {t('ui.farm_creation.budget_goal', { defaultValue: 'Set Budget Goal' })}: 
                <Text style={styles.budgetValue}> ₹{budgetGoal.toLocaleString('en-IN')}</Text>
              </Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={10000}
                  maximumValue={200000}
                  step={5000}
                  value={budgetGoal}
                  onValueChange={setBudgetGoal}
                  minimumTrackTintColor="#58CC02"
                  maximumTrackTintColor="#E5E5E5"
                  thumbTintColor="#FFC800"
                />
              </View>
            </View>

            <View style={styles.section}>
              <TranslatedText tKey="ui.farm_creation.farm_name" style={styles.sectionTitle} />
              <View style={[styles.inputContainer, inputFocused && styles.inputContainerFocused]}>
                <TextInput
                  editable={!loading}
                  style={styles.input}
                  placeholder="e.g., Sunrise Acres"
                  placeholderTextColor="#AFAFAF"
                  value={farmName}
                  onChangeText={setFarmName}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
              </View>
              {!isValidName && farmName.length > 0 && (
                <Text style={styles.errorText}>
                  Please enter a farm name
                </Text>
              )}
            </View>

          </ScrollView>

          <View style={styles.stickyBottom}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.startButton,
                (!isValidName || loading) && styles.startButtonDisabled
              ]}
              disabled={!isValidName || loading}
              onPress={handleStartSeason}
            >
              <Text style={[
                styles.startButtonText,
                (!isValidName || loading) && styles.startButtonTextDisabled
              ]}>
                {loading ? 'Setting up...' : 'Start Season'}
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
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4B4B4B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#AFAFAF',
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  strategyCard: {
    width: '100%',
    backgroundColor: '#CE82FF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    borderBottomColor: '#A559D6',
    flexDirection: 'row',
  },
  strategyIconPlaceholder: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  strategyText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4B4B4B',
    marginBottom: 16,
  },
  budgetValue: {
    color: '#58CC02',
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  cropCardWrapper: {
    width: '46%',
  },
  cropCard: {
    backgroundColor: '#E5E5E5',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#D4D4D4',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cropCardSelected: {
    backgroundColor: '#58CC02',
    borderBottomColor: '#46A302',
    borderColor: '#58CC02',
  },
  cropText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#777777',
  },
  cropTextSelected: {
    color: '#FFFFFF',
  },
  sliderContainer: {
    backgroundColor: '#F3F3F3',
    borderRadius: 24,
    padding: 16,
    marginTop: 8,
  },
  slider: {
    width: '100%',
    height: 40,
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
  errorText: {
    color: '#FF4B4B',
    marginTop: 8,
    marginLeft: 16,
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
    color: '#1B3D01',
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  startButtonTextDisabled: {
    color: '#AFAFAF',
  }
});
