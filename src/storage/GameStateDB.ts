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
    await this.db.runAsync(
      `INSERT OR REPLACE INTO game_state (id, state, updatedAt) VALUES (?, ?, ?)`,
      [playerId, JSON.stringify(state), timestamp]
    );
  }

  async loadGameState(playerId: string): Promise<GameState | null> {
    if (!this.isInitialized) await this.init();
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
    await this.db.runAsync(
      `INSERT INTO sync_queue (id, type, payload, timestamp) VALUES (?, ?, ?, ?)`,
      [id, type, JSON.stringify(payload), timestamp]
    );
  }

  async getSyncQueue(): Promise<SyncOperation[]> {
    if (!this.isInitialized) await this.init();
    return await this.db.getAllAsync(`SELECT * FROM sync_queue ORDER BY timestamp ASC`);
  }

  async removeSyncOperation(id: string) {
    if (!this.isInitialized) await this.init();
    await this.db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  }
}

export const GameStateDB = new GameStateDatabase();
