import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HarvestScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Season Harvest</Text>
          <View style={styles.starContainer}>
            <Text style={styles.starFilled}>★</Text>
            <Text style={styles.starFilled}>★</Text>
            <Text style={styles.starEmpty}>☆</Text>
          </View>
        </View>

        {/* Visual Results */}
        <View style={styles.visualCard}>
          <View style={styles.harvestIllustration} />
          <Text style={styles.harvestText}>Average Yield!</Text>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <Text style={styles.summaryTitle}>Financial Overview</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Income</Text>
            <Text style={styles.summaryValuePositive}>+₹12,000</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Expenses & Debt</Text>
            <Text style={styles.summaryValueNegative}>-₹4,000</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <Text style={styles.summaryLabelBold}>Net Cash</Text>
            <Text style={styles.summaryValueBold}>₹23,000</Text>
          </View>
        </View>

        {/* Lesson Card */}
        <View style={styles.lessonCard}>
          <Text style={styles.lessonTitle}>💡 Financial Lesson</Text>
          <Text style={styles.lessonBody}>
            Taking a small loan at the right interest rate helped you buy better seeds. Managing the debt payments means you still made a profit this season!
          </Text>
        </View>

        {/* Action Area */}
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Next Season</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Review Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff8ff' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#233039', marginBottom: 8 },
  starContainer: { flexDirection: 'row', gap: 8 },
  starFilled: { fontSize: 32, color: '#f7ba00' },
  starEmpty: { fontSize: 32, color: '#a0afb9' },
  visualCard: { backgroundColor: '#f6cfc2', borderRadius: 32, padding: 24, alignItems: 'center', marginBottom: 24, elevation: 2 },
  harvestIllustration: { width: '100%', height: 160, backgroundColor: '#e7c1b4', borderRadius: 24, marginBottom: 16 },
  harvestText: { fontSize: 20, fontWeight: '700', color: '#65493f' },
  financialCard: { backgroundColor: '#ffffff', borderRadius: 32, padding: 24, marginBottom: 24, elevation: 4 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#4f5d67', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: '#4f5d67' },
  summaryValuePositive: { fontSize: 16, fontWeight: '700', color: '#176a21' },
  summaryValueNegative: { fontSize: 16, fontWeight: '700', color: '#b02500' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#e3f3ff', paddingTop: 12, marginTop: 4 },
  summaryLabelBold: { fontSize: 18, fontWeight: '800', color: '#233039' },
  summaryValueBold: { fontSize: 18, fontWeight: '800', color: '#233039' },
  lessonCard: { backgroundColor: '#ffca4d', borderRadius: 24, padding: 20, marginBottom: 32, elevation: 6 },
  lessonTitle: { fontSize: 18, fontWeight: '800', color: '#5c4400', marginBottom: 8 },
  lessonBody: { fontSize: 15, color: '#664b00', lineHeight: 22 },
  primaryButton: { backgroundColor: '#176a21', borderRadius: 999, paddingVertical: 20, alignItems: 'center', marginBottom: 16, elevation: 4 },
  primaryButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  secondaryButton: { paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#176a21', fontSize: 18, fontWeight: '700' }
});
