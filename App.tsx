import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { GameStateDB } from './src/storage/GameStateDB';
import { SyncManager } from './src/storage/SyncManager';
import gameEngine from './src/engine/GameEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App: React.FC = () => {
  useEffect(() => {
    const initStorage = async () => {
      await GameStateDB.init();
      SyncManager.start();

      // Restore saved game state into the engine on startup
      const playerId = await AsyncStorage.getItem('playerId');
      if (playerId) {
        const savedState = await GameStateDB.loadGameState(playerId);
        if (savedState?.player) {
          // Returning user — restore full session
          gameEngine.loadState(savedState);
          console.log(`[App] Restored game state for player: ${playerId}`);
        } else {
          // playerId exists but no saved state found (e.g. DB was cleared)
          gameEngine.initGame();
          console.log('[App] No saved state found, starting fresh game.');
        }
      } else {
        // Brand-new user — initialise with defaults, Onboarding will configure them
        gameEngine.initGame();
        console.log('[App] New user — initialised fresh game engine.');
      }
    };
    initStorage();

    return () => {
      SyncManager.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
