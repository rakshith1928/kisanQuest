import { apiClient } from './apiClient';

export interface GameStatePayload {
  state: any;
}

export const gameService = {
  async syncGameState(state: any): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/api/game/sync', { state });
  },

  async getLeaderboard(): Promise<any[]> {
    return apiClient.get('/api/game/leaderboard');
  }
};
