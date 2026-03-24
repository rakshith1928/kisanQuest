import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GameplayScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.seasonText}>Kharif Season</Text>
          <View style={styles.weatherBadge}>
            <Text style={styles.weatherText}>☀️ Sunny</Text>
          </View>
        </View>

        {/* Financial Status Bar */}
        <View style={styles.statusBar}>
          <View style={[styles.statItem, { backgroundColor: '#d1ffc8' }]}>
            <Text style={[styles.statLabel, { color: '#006016' }]}>Cash</Text>
            <Text style={[styles.statValue, { color: '#004b0f' }]}>₹15,000</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#ffefec' }]}>
            <Text style={[styles.statLabel, { color: '#b92902' }]}>Debt</Text>
            <Text style={[styles.statValue, { color: '#520c00' }]}>₹5,000</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: '#fff1db' }]}>
            <Text style={[styles.statLabel, { color: '#765600' }]}>Savings</Text>
            <Text style={[styles.statValue, { color: '#453100' }]}>₹2,000</Text>
          </View>
        </View>

        {/* Main Hub (Farm Plot) */}
        <View style={styles.mainHub}>
          <View style={styles.farmPlotIllustration} />
          <Text style={styles.farmStatusText}>Crops are growing well...</Text>
        </View>

        {/* Event / Action Area */}
        <View style={styles.eventCard}>
          <Text style={styles.eventTitle}>⚠️ Unexpected Rain Delay!</Text>
          <Text style={styles.eventDescription}>
            Unseasonal rains are threatening your harvest. How do you want to protect your crops?
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryAction}>
              <Text style={styles.primaryActionText}>Use Tarps (₹500)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Wait it out (Free)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tertiaryAction}>
              <Text style={styles.tertiaryActionText}>Claim Insurance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f2' },
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
  seasonText: { fontSize: 28, fontWeight: '800', color: '#2d2f2c' },
  weatherBadge: { backgroundColor: '#e8e9e3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  weatherText: { fontSize: 16, fontWeight: '600', color: '#5a5c58' },
  statusBar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statItem: { flex: 1, padding: 12, borderRadius: 16, marginHorizontal: 4, alignItems: 'center', elevation: 2 },
  statLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '800' },
  mainHub: { alignItems: 'center', marginBottom: 40 },
  farmPlotIllustration: { width: '100%', height: 220, backgroundColor: '#e2e3dd', borderRadius: 32, marginBottom: 16 },
  farmStatusText: { fontSize: 16, fontWeight: '600', color: '#5a5c58' },
  eventCard: { backgroundColor: '#fed3c7', borderRadius: 32, padding: 24, elevation: 4 },
  eventTitle: { fontSize: 22, fontWeight: '800', color: '#51352c', marginBottom: 12 },
  eventDescription: { fontSize: 16, color: '#67483f', lineHeight: 24, marginBottom: 24 },
  actionButtons: { gap: 12 },
  primaryAction: { backgroundColor: '#0a6a1d', paddingVertical: 18, borderRadius: 24, alignItems: 'center', elevation: 4 },
  primaryActionText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  secondaryAction: { backgroundColor: '#ffca52', paddingVertical: 18, borderRadius: 24, alignItems: 'center' },
  secondaryActionText: { color: '#5c4300', fontSize: 18, fontWeight: '700' },
  tertiaryAction: { paddingVertical: 16, alignItems: 'center' },
  tertiaryActionText: { color: '#0a6a1d', fontSize: 16, fontWeight: '700' }
});
