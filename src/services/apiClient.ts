import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';

class ApiClient {
  private async getHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (e) {
        // Ignored
      }
      throw new Error(`API Error (${response.status}): ${errorMessage}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any, customHeaders?: HeadersInit): Promise<T> {
    let headers = await this.getHeaders();
    let body: any = data ? JSON.stringify(data) : undefined;
    
    if (customHeaders) {
      // Allow overriding exactly the content type if needed (e.g. multipart/form-data)
      headers = { ...headers, ...customHeaders };
      
      // If FormData is passed, fetch handles Content-Type boundary automatically 
      // if Content-Type header is not strictly overwritten 
      if (data instanceof FormData) {
        body = data;
        // Fetch requires the browser to set the multipart/form-data boundary itself
        delete (headers as Record<string, string>)['Content-Type'];
      }
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
