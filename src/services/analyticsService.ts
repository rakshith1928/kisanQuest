import { apiClient } from './apiClient';

export interface GameEvent {
  eventType: string;
  eventData?: any;
}

export const analyticsService = {
  async trackEvent(eventType: string, eventData?: any): Promise<void> {
    await apiClient.post('/api/analytics/event', { eventType, eventData });
  },

  async getPlayerEvents(playerId: string): Promise<any[]> {
    return apiClient.get(`/api/analytics/player/${playerId}`);
  },

  async getPopularEvents(): Promise<any[]> {
    return apiClient.get('/api/analytics/popular');
  },

  async getEventsTimeline(): Promise<any[]> {
    return apiClient.get('/api/analytics/timeline');
  }
};
