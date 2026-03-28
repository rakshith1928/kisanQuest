import { apiClient } from './apiClient';
import { GameStateDB } from '../storage/GameStateDB';
import { SyncManager } from '../storage/SyncManager';

export interface GameStatePayload {
  state: any;
}

export const gameService = {
  async syncGameState(state: any): Promise<{ message: string }> {
    // Attempt local player ID or default
    const playerId = state?.player?.name || 'default_player';
    
    // 1. Save state locally to SQLite
    await GameStateDB.saveGameState(playerId, state);
    
    // 2. Queue for offline-first sync
    await GameStateDB.enqueueSyncOperation('SYNC_GAME_STATE', { state });
    
    // 3. Trigger immediate sync if online
    SyncManager.processQueue();
    
    return { message: 'State saved locally and synced' };
  },

  async getLeaderboard(): Promise<any[]> {
    return apiClient.get('/api/game/leaderboard');
  }
};
