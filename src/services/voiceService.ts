import { apiClient } from './apiClient';

export const voiceService = {
  async processSTT(audioBase64: string, languageCode: string = 'hi'): Promise<{ transcript?: string }> {
    return apiClient.post<{ transcript?: string }>('/api/voice/stt', { audio: audioBase64, languageCode });
  },

  async processTTS(text: string, languageCode: string = 'hi'): Promise<{ audioContent: string }> {
    return apiClient.post<{ audioContent: string }>('/api/voice/tts', { text, languageCode });
  }
};
