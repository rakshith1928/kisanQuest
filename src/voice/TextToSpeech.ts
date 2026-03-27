import * as Speech from 'expo-speech';

/**
 * TextToSpeech.ts
 * Wraps expo-speech for device TTS with optional Google Cloud TTS for higher quality.
 * Falls back to expo-speech when no API key is configured.
 */

// Constants removed: backend handles model mapping now.

export interface VoiceConfig {
    languageCode: string;
    name: string;
    ssmlGender: string;
}

export interface TTSOptions {
    rate?: number;
    pitch?: number;
    onDone?: () => void;
}

//type LanguageCode = 'hi' | 'en' | 'mr' | 'ta' | 'te' | 'kn';

/*const VOICE_CONFIG: Record<LanguageCode, VoiceConfig> = {
    hi: { languageCode: 'hi-IN', name: 'hi-IN-Standard-A', ssmlGender: 'FEMALE' },
    en: { languageCode: 'en-IN', name: 'en-IN-Standard-A', ssmlGender: 'FEMALE' },
    mr: { languageCode: 'mr-IN', name: 'mr-IN-Standard-A', ssmlGender: 'FEMALE' },
    ta: { languageCode: 'ta-IN', name: 'ta-IN-Standard-A', ssmlGender: 'FEMALE' },
    te: { languageCode: 'te-IN', name: 'te-IN-Standard-A', ssmlGender: 'FEMALE' },
    kn: { languageCode: 'kn-IN', name: 'kn-IN-Standard-A', ssmlGender: 'FEMALE' },
};*/

// Expo-speech locale fallback
const EXPO_LOCALE_MAP: Record<string, string> = {
    hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN',
    ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN',
};

const TextToSpeech = {
    /**
     * Speak text. Uses backend TTS proxy, else falls back to local expo-speech on failure.
     */
    async speak(text: string, langCode: string = 'hi', options: TTSOptions = {}): Promise<void> {
        return this._speakHuggingFace(text, langCode, options);
    },

    /**
     * Device TTS via expo-speech (offline, uses system voice).
     */
    async _speakDevice(text: string, langCode: string, options: TTSOptions = {}): Promise<void> {
        await Speech.speak(text, {
            language: EXPO_LOCALE_MAP[langCode] || 'hi-IN',
            rate: options.rate || 0.85,
            pitch: options.pitch || 1.0,
            onDone: options.onDone,
        });
    },

    /**
     * Google Cloud TTS (higher quality Wavenet voices) or Hugging Face.
     * Hits the Node.js backend proxy which holds the API keys securely.
     */
    async _speakHuggingFace(text: string, langCode: string, options: TTSOptions = {}): Promise<void> {
        try {
            const { voiceService } = require('../services/voiceService');

            let data;
            try {
                data = await voiceService.processTTS(text, langCode);
            } catch (err: any) {
                if (err.message.includes('401')) {
                    console.warn('[TTS] Unauthorized. Are you logged in? Falling back to device speech.');
                }
                throw err;
            }

            const base64 = data.audioContent;

            if (!base64 || base64.startsWith('mocked_')) {
                throw new Error('Received fallback mock response from server');
            }

            const { Sound } = require('expo-av');
            // Assuming the server returns mp3 or wav base64
            const { sound } = await Sound.createAsync(
                { uri: `data:audio/mp3;base64,${base64}` },
                { shouldPlay: true }
            );
            sound.setOnPlaybackStatusUpdate((status: { didJustFinish?: boolean }) => {
                if (status.didJustFinish) {
                    sound.unloadAsync();
                    if (options.onDone) options.onDone();
                }
            });
        } catch (err) {
            console.warn('[TTS] Backend proxy failed, falling back to device TTS:', err);
            this._speakDevice(text, langCode, options);
        }
    },

    /**
     * Stop any ongoing speech.
     */
    async stop(): Promise<void> {
        Speech.stop();
    },

    /**
     * Check if currently speaking.
     */
    async isSpeaking(): Promise<boolean> {
        return Speech.isSpeakingAsync();
    },

    /**
     * Get available device voices for a language.
     */
    async getAvailableVoices(langCode: string): Promise<Speech.Voice[]> {
        const voices = await Speech.getAvailableVoicesAsync();
        const locale = EXPO_LOCALE_MAP[langCode] || 'hi-IN';
        return voices.filter(v => v.language.startsWith(locale.split('-')[0]));
    },
};

export default TextToSpeech;
