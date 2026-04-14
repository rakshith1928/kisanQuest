import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import gameEngine from '../engine/GameEngine';
import { useTranslation } from 'react-i18next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SkillTree'>;

const getSKILLS = (t: any) => [
  { id: 'Insurance Literacy', icon: '🛡️', cost: 50, desc: t('ui.skill_tree.skills.insurance_literacy.desc'), name: t('ui.skill_tree.skills.insurance_literacy.name') },
  { id: 'Budget Planning', icon: '📝', cost: 100, desc: t('ui.skill_tree.skills.budget_planning.desc'), name: t('ui.skill_tree.skills.budget_planning.name') },
  { id: 'Negotiation', icon: '🤝', cost: 150, desc: t('ui.skill_tree.skills.negotiation.desc'), name: t('ui.skill_tree.skills.negotiation.name') },
  { id: 'Digital Payments', icon: '📱', cost: 200, desc: t('ui.skill_tree.skills.digital_payments.desc'), name: t('ui.skill_tree.skills.digital_payments.name') },
  { id: 'Fraud Detection', icon: '🕵️', cost: 300, desc: t('ui.skill_tree.skills.fraud_detection.desc'), name: t('ui.skill_tree.skills.fraud_detection.name') },
];

interface ScaleButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  children: React.ReactNode;
  variant?: 'primary' | 'disabled';
}

const ScaleButton = ({ onPress, disabled, style, children, variant = "primary" }: ScaleButtonProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => { if (!disabled) Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start(); };
  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
      onPress && onPress();
    }
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: disabled ? 0.6 : 1 }}>
      <TouchableOpacity activeOpacity={1} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[styles.btnBase, styles[`btn${variant}` as keyof typeof styles], style]}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function SkillTreeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState(gameEngine.getState());

  useEffect(() => {
    const unsub = gameEngine.getStateMachine().onStateChange(() => setGameState(gameEngine.getState()));
    return () => unsub();
  }, []);

  const handleUnlock = (skillId: string, cost: number) => {
    if (gameEngine.unlockSkill(skillId, cost)) {
      setGameState({ ...gameEngine.getState() }); // local re-render
    } else {
      Alert.alert(t('ui.skill_tree.not_enough_points'), t('ui.skill_tree.earn_more_msg'));
    }
  };

  const lp = gameState.player.score.literacyPoints;
  const unlocked = gameState.player.score.unlockedSkills || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{fontSize: 24}}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('ui.skill_tree.title')}</Text>
        <View style={styles.lpTag}>
          <Text style={styles.lpText}>{t('ui.skill_tree.lp_label', { count: lp })}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {getSKILLS(t).map((skill, idx) => {
          const isUnlocked = unlocked.includes(skill.id);
          const canAfford = lp >= skill.cost;
          return (
            <View key={skill.id} style={[styles.skillCard, isUnlocked && styles.skillCardUnlocked]}>
              <View style={styles.iconBox}>
                <Text style={{ fontSize: 32 }}>{skill.icon}</Text>
              </View>
              <View style={styles.skillContent}>
                <Text style={styles.skillName}>{skill.name}</Text>
                <Text style={styles.skillDesc}>{skill.desc}</Text>
              </View>
              <View style={styles.actionBox}>
                {isUnlocked ? (
                  <Text style={styles.unlockedText}>{t('ui.skill_tree.unlocked')}</Text>
                ) : (
                  <ScaleButton 
                    variant={canAfford ? "primary" : "disabled"} 
                    disabled={!canAfford} 
                    onPress={() => handleUnlock(skill.id, skill.cost)}
                    style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                  >
                    <Text style={[styles.btnText, !canAfford && { color: '#AFAFAF' }]}>⭐ {skill.cost}</Text>
                  </ScaleButton>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 24, paddingBottom: 12 },
  backBtn: { padding: 8, backgroundColor: '#E5E5E5', borderRadius: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#4B4B4B' },
  lpTag: { backgroundColor: '#FFF0D3', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 2, borderColor: '#FFC800' },
  lpText: { fontSize: 18, fontWeight: '800', color: '#D3A500' },
  scroll: { padding: 24, gap: 16 },
  skillCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, borderWidth: 2, borderColor: '#E5E5E5' },
  skillCardUnlocked: { borderColor: '#58CC02', backgroundColor: '#F2FBF1' },
  iconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F6F9FA', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  skillContent: { flex: 1 },
  skillName: { fontSize: 18, fontWeight: '800', color: '#4B4B4B', marginBottom: 4 },
  skillDesc: { fontSize: 14, fontWeight: '600', color: '#AFAFAF' },
  actionBox: { marginLeft: 16, alignItems: 'flex-end' },
  unlockedText: { color: '#58CC02', fontWeight: '800', fontSize: 16 },
  btnBase: { borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4 },
  btnPrimary: { backgroundColor: '#58CC02', borderBottomColor: '#46A302' },
  btndisabled: { backgroundColor: '#E5E5E5', borderBottomColor: '#D1D1D1' },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textTransform: 'uppercase' },
});
