import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { GameState } from '../engine/GameEngine';

export interface SyncOperation {
  id: string;
  type: string;
  payload: string;
  timestamp: number;
}

class GameStateDatabase {
  private db!: SQLite.SQLiteDatabase;
  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    if (Platform.OS === 'web') {
      console.log('GameStateDB: Web detected, using localStorage instead of SQLite.');
      this.isInitialized = true;
      return;
    }
    
    try {
      this.db = await SQLite.openDatabaseAsync('kisanquest.db');

      await this.db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS game_state (
          id TEXT PRIMARY KEY,
          state TEXT NOT NULL,
          updatedAt INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          payload TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
      `);

      this.isInitialized = true;
      console.log('GameStateDB: Initialized offline SQLite successfully.');
    } catch (err) {
      console.error('GameStateDB: DB init error:', err);
      throw err;
    }
  }

  async saveGameState(playerId: string, state: GameState) {
    if (!this.isInitialized) await this.init();
    const timestamp = Date.now();
    
    if (Platform.OS === 'web') {
      localStorage.setItem(`gameState_${playerId}`, JSON.stringify(state));
      return;
    }

    await this.db.runAsync(
      `INSERT OR REPLACE INTO game_state (id, state, updatedAt) VALUES (?, ?, ?)`,
      [playerId, JSON.stringify(state), timestamp]
    );
  }

  async loadGameState(playerId: string): Promise<GameState | null> {
    if (!this.isInitialized) await this.init();
    
    if (Platform.OS === 'web') {
      const stateStr = localStorage.getItem(`gameState_${playerId}`);
      return stateStr ? JSON.parse(stateStr) as GameState : null;
    }

    const result = await this.db.getFirstAsync<{ state: string }>(`SELECT * FROM game_state WHERE id = ?`, [playerId]);
    if (result) {
      return JSON.parse(result.state) as GameState;
    }
    return null;
  }

  async enqueueSyncOperation(type: string, payload: any) {
    if (!this.isInitialized) await this.init();
    const id = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
    const timestamp = Date.now();
    
    if (Platform.OS === 'web') {
      const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
      queue.push({ id, type, payload: JSON.stringify(payload), timestamp });
      localStorage.setItem('syncQueue', JSON.stringify(queue));
      return;
    }

    await this.db.runAsync(
      `INSERT INTO sync_queue (id, type, payload, timestamp) VALUES (?, ?, ?, ?)`,
      [id, type, JSON.stringify(payload), timestamp]
    );
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    if (!this.isInitialized) await this.init();
    
    if (Platform.OS === 'web') {
      return JSON.parse(localStorage.getItem('syncQueue') || '[]');
    }

    return await this.db.getAllAsync(`SELECT * FROM sync_queue ORDER BY timestamp ASC`);
  }

  async removeSyncOperation(id: string) {
    if (!this.isInitialized) await this.init();
    
    if (Platform.OS === 'web') {
      let queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
      queue = queue.filter((item: any) => item.id !== id);
      localStorage.setItem('syncQueue', JSON.stringify(queue));
      return;
    }

    await this.db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  }
}

export const GameStateDB = new GameStateDatabase();
