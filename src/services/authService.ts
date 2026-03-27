import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

export interface AuthResponse {
  token: string;
  player: {
    id?: string;
    _id?: string; // Mongoose returns _id for login
    name: string;
    farmName?: string;
  };
}

export const authService = {
  async register(name: string, language: string = 'hi', region: string = 'Unknown'): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', { name, language, region });
    if (response.token) {
      await AsyncStorage.setItem('token', response.token);
      const id = response.player.id || response.player._id;
      if (id) await AsyncStorage.setItem('playerId', id.toString());
      await AsyncStorage.setItem('playerName', response.player.name);
    }
    return response;
  },

  async login(playerId: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', { playerId });
    if (response.token) {
      await AsyncStorage.setItem('token', response.token);
      const id = response.player.id || response.player._id;
      if (id) await AsyncStorage.setItem('playerId', id.toString());
      await AsyncStorage.setItem('playerName', response.player.name);
    }
    return response;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('playerId');
    await AsyncStorage.removeItem('playerName');
  },
  
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('token');
  }
};
