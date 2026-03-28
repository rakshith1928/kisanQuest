import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '../screens/OnboardingScreen';
import FarmCreationScreen from '../screens/FarmCreationScreen';
import GameplayScreen from '../screens/GameplayScreen';
import HarvestScreen from '../screens/HarvestScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  FarmCreation: undefined;
  Gameplay: undefined;
  Harvest: { outcome?: any };
  Dashboard: undefined;
  History: undefined;
  Leaderboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="FarmCreation" component={FarmCreationScreen} />
        <Stack.Screen name="Gameplay" component={GameplayScreen} />
        <Stack.Screen name="Harvest" component={HarvestScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
