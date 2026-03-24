import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Player Profile</Text>
          <View style={styles.avatarPlaceholder} />
        </View>

        {/* Financial Health Score */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Financial Health</Text>
          <View style={styles.circularScore}>
            <Text style={styles.scoreValue}>85</Text>
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>
          <Text style={styles.scoreSubtitle}>Great job! You're managing risks well.</Text>
        </View>

        {/* Milestones & Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlocked Badges</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
            <View style={styles.badgeItem}>
              <View style={styles.badgeCircle}><Text>🌱</Text></View>
              <Text style={styles.badgeText}>First Sown</Text>
            </View>
            <View style={styles.badgeItem}>
              <View style={styles.badgeCircle}><Text>🛡️</Text></View>
              <Text style={styles.badgeText}>Insured</Text>
            </View>
            <View style={styles.badgeItem}>
              <View style={styles.badgeCircle}><Text>💰</Text></View>
              <Text style={styles.badgeText}>Debt Free</Text>
            </View>
          </ScrollView>
        </View>

        {/* Season History Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Season History</Text>
          <View style={styles.timelineCard}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineSeason}>Season 2: Rabi</Text>
                <Text style={styles.timelineNetPositive}>+₹12,000</Text>
              </View>
            </View>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#a0afb9' }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineSeason}>Season 1: Kharif</Text>
                <Text style={styles.timelineNetNegative}>-₹1,500</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eff8ff' },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: '#233039' },
  avatarPlaceholder: { width: 56, height: 56, backgroundColor: '#9df197', borderRadius: 28 },
  scoreCard: { backgroundColor: '#ffffff', borderRadius: 32, padding: 32, alignItems: 'center', marginBottom: 32, elevation: 4 },
  scoreTitle: { fontSize: 20, fontWeight: '700', color: '#4f5d67', marginBottom: 16 },
  circularScore: { width: 140, height: 140, borderRadius: 70, borderWidth: 12, borderColor: '#176a21', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  scoreValue: { fontSize: 40, fontWeight: '800', color: '#176a21' },
  scoreMax: { fontSize: 16, color: '#4f5d67', marginTop: -4 },
  scoreSubtitle: { fontSize: 15, color: '#4f5d67', textAlign: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#233039', marginBottom: 16 },
  badgeScroll: { gap: 16 },
  badgeItem: { alignItems: 'center', marginRight: 16 },
  badgeCircle: { width: 72, height: 72, backgroundColor: '#ffca4d', borderRadius: 36, justifyContent: 'center', alignItems: 'center', elevation: 4, marginBottom: 8 },
  badgeText: { fontSize: 14, fontWeight: '600', color: '#5c4400' },
  timelineCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, elevation: 2 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#176a21', marginRight: 16, marginTop: 4 },
  timelineContent: { flex: 1 },
  timelineSeason: { fontSize: 18, fontWeight: '700', color: '#4f5d67', marginBottom: 4 },
  timelineNetPositive: { fontSize: 16, fontWeight: '700', color: '#176a21' },
  timelineNetNegative: { fontSize: 16, fontWeight: '700', color: '#b02500' }
});
