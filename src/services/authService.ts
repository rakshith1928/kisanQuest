import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

export interface AuthResponse {
  token: string;
  player: {
    id: string;
    name: string;
    farmName?: string;
  };
}

export const authService = {
  async register(name: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', { name });
    if (response.token) {
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('playerId', response.player.id.toString());
      await AsyncStorage.setItem('playerName', response.player.name);
    }
    return response;
  },

  async login(name: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', { name });
    if (response.token) {
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('playerId', response.player.id.toString());
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
