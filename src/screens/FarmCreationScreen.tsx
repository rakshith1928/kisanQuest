import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import gameEngine from '../engine/GameEngine';

const CROPS = ['Rice', 'Wheat', 'Cotton', 'Sugarcane'];

export default function FarmCreationScreen({ navigation }: any) {
  const [selectedCrop, setSelectedCrop] = useState<string>('Rice');
  const [farmName, setFarmName] = useState('');
  const [budgetGoal, setBudgetGoal] = useState<number>(50000);
  const [loading, setLoading] = useState(false);

  const isValidName = farmName.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Up Your Farm</Text>
          <Text style={{ color: '#5a5c58', marginTop: 4, marginBottom: 16, fontSize: 16 }}>
            Choose your strategy for this season
          </Text>
          <View style={styles.plotIllustration} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Main Crop</Text>
          <View style={styles.grid}>
            {CROPS.map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[styles.cropCard, selectedCrop === crop && styles.cropCardSelected]}
                onPress={() => !loading && setSelectedCrop(crop)}
              >
                <Text style={[styles.cropText, selectedCrop === crop && styles.cropTextSelected]}>{crop}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Goal: ₹{budgetGoal.toLocaleString('en-IN')}</Text>
          <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={10000}
            maximumValue={200000}
            step={5000}
            value={budgetGoal}
            onSlidingComplete={setBudgetGoal}
            minimumTrackTintColor="#0a6a1d"
            maximumTrackTintColor="#e8e9e3"
            thumbTintColor="#ffca52"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name Your Farm</Text>
          <View style={styles.inputContainer}>
            <TextInput
              editable={!loading}
              style={styles.input}
              placeholder="e.g., Sunrise Acres"
              placeholderTextColor="#5a5c58"
              value={farmName}
              onChangeText={setFarmName}
            />
          </View>
          {!isValidName && (
            <Text style={{ color: '#b02500', marginTop: 8, marginLeft: 16 }}>
              Please enter a farm name
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.startButton, (!isValidName || loading) && styles.startButtonDisabled, { opacity: loading ? 0.7 : 1 }]}
          disabled={!isValidName || loading}
          onPress={() => {
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

              navigation.replace('Dashboard');
            }, 400);
          }}
        >
          <Text style={styles.startButtonText}>{loading ? 'Setting up...' : 'Start Season'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f1ec' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '800', color: '#2d2f2c', marginBottom: 16 },
  plotIllustration: { width: '100%', height: 160, backgroundColor: '#e2e3dd', borderRadius: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#2d2f2c', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cropCard: { flex: 1, minWidth: '45%', backgroundColor: '#ffffff', borderRadius: 24, padding: 20, alignItems: 'center', shadowColor: '#2d2f2c', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 },
  cropCardSelected: { backgroundColor: '#9df898', borderWidth: 2, borderColor: '#0a6a1d' },
  cropText: { fontSize: 16, fontWeight: '600', color: '#5a5c58' },
  cropTextSelected: { color: '#006016' },
  sliderTrack: { height: 24, backgroundColor: '#e8e9e3', borderRadius: 12, justifyContent: 'center' },
  sliderFill: { height: 24, backgroundColor: '#0a6a1d', borderRadius: 12, position: 'absolute' },
  sliderThumb: { width: 32, height: 32, backgroundColor: '#ffca52', borderRadius: 16, position: 'absolute', left: '48%', elevation: 4 },
  inputContainer: { backgroundColor: '#dcddd7', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 16 },
  input: { fontSize: 18, color: '#2d2f2c' },
  startButton: { backgroundColor: '#0a6a1d', borderRadius: 999, paddingVertical: 24, alignItems: 'center', marginTop: 16, elevation: 8 },
  startButtonDisabled: { backgroundColor: '#a0afb9', elevation: 0 },
  startButtonText: { color: '#ffffff', fontSize: 20, fontWeight: '700' }
});
