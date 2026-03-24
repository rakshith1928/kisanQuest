import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CROPS = ['Rice', 'Wheat', 'Cotton', 'Sugarcane'];

export default function FarmCreationScreen({ navigation }: any) {
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);
  const [farmName, setFarmName] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Set Up Your Farm</Text>
          <View style={styles.plotIllustration} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Main Crop</Text>
          <View style={styles.grid}>
            {CROPS.map((crop) => (
              <TouchableOpacity
                key={crop}
                style={[styles.cropCard, selectedCrop === crop && styles.cropCardSelected]}
                onPress={() => setSelectedCrop(crop)}
              >
                <Text style={[styles.cropText, selectedCrop === crop && styles.cropTextSelected]}>{crop}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Goal (₹)</Text>
          <View style={styles.sliderTrack}>
            <View style={[styles.sliderFill, { width: '50%' }]} />
            <View style={styles.sliderThumb} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name Your Farm</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., Sunrise Acres"
              placeholderTextColor="#5a5c58"
              value={farmName}
              onChangeText={setFarmName}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.startButton}>
          <Text style={styles.startButtonText}>Start Season</Text>
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
  cropCardSelected: { backgroundColor: '#9df898' },
  cropText: { fontSize: 16, fontWeight: '600', color: '#5a5c58' },
  cropTextSelected: { color: '#006016' },
  sliderTrack: { height: 24, backgroundColor: '#e8e9e3', borderRadius: 12, justifyContent: 'center' },
  sliderFill: { height: 24, backgroundColor: '#0a6a1d', borderRadius: 12, position: 'absolute' },
  sliderThumb: { width: 32, height: 32, backgroundColor: '#ffca52', borderRadius: 16, position: 'absolute', left: '48%', elevation: 4 },
  inputContainer: { backgroundColor: '#dcddd7', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 16 },
  input: { fontSize: 18, color: '#2d2f2c' },
  startButton: { backgroundColor: '#0a6a1d', borderRadius: 999, paddingVertical: 24, alignItems: 'center', marginTop: 16, elevation: 8 },
  startButtonText: { color: '#ffffff', fontSize: 20, fontWeight: '700' }
});
