import * as Speech from 'expo-speech';

/**
 * TextToSpeech.ts
 * Wraps expo-speech for device TTS with optional Google Cloud TTS for higher quality.
 * Falls back to expo-speech when no API key is configured.
 */

const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const API_KEY: string | null = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || null;

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

type LanguageCode = 'hi' | 'en' | 'mr' | 'ta' | 'te' | 'kn';

const VOICE_CONFIG: Record<LanguageCode, VoiceConfig> = {
    hi: { languageCode: 'hi-IN', name: 'hi-IN-Standard-A', ssmlGender: 'FEMALE' },
    en: { languageCode: 'en-IN', name: 'en-IN-Standard-A', ssmlGender: 'FEMALE' },
    mr: { languageCode: 'mr-IN', name: 'mr-IN-Standard-A', ssmlGender: 'FEMALE' },
    ta: { languageCode: 'ta-IN', name: 'ta-IN-Standard-A', ssmlGender: 'FEMALE' },
    te: { languageCode: 'te-IN', name: 'te-IN-Standard-A', ssmlGender: 'FEMALE' },
    kn: { languageCode: 'kn-IN', name: 'kn-IN-Standard-A', ssmlGender: 'FEMALE' },
};

// Expo-speech locale fallback
const EXPO_LOCALE_MAP: Record<string, string> = {
    hi: 'hi-IN', en: 'en-IN', mr: 'mr-IN',
    ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN',
};

const TextToSpeech = {
    /**
     * Speak text. Uses Google Cloud TTS if API key available, else expo-speech.
     */
    async speak(text: string, langCode: string = 'hi', options: TTSOptions = {}): Promise<void> {
        if (API_KEY) {
            return this._speakGoogleCloud(text, langCode, options);
        }
        return this._speakDevice(text, langCode, options);
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
     * Google Cloud TTS (higher quality Wavenet voices).
     * Downloads audio and plays it via expo-av.
     */
    async _speakGoogleCloud(text: string, langCode: string, options: TTSOptions = {}): Promise<void> {
        try {
            const voice = VOICE_CONFIG[langCode as LanguageCode] || VOICE_CONFIG['hi'];
            const body = {
                input: { text },
                voice,
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: options.rate || 0.9,
                    pitch: options.pitch || 0,
                    effectsProfileId: ['handset-class-device'],
                },
            };

            const res = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            const audioContent = data?.audioContent;

            if (!audioContent) throw new Error('No audio content returned');

            // Play base64 MP3 via expo-av
            const { Sound } = require('expo-av');
            const { sound } = await Sound.createAsync(
                { uri: `data:audio/mp3;base64,${audioContent}` },
                { shouldPlay: true }
            );
            sound.setOnPlaybackStatusUpdate((status: { didJustFinish?: boolean }) => {
                if (status.didJustFinish) {
                    sound.unloadAsync();
                    if (options.onDone) options.onDone();
                }
            });
        } catch (err) {
            console.warn('[TTS] Google Cloud failed, falling back to device TTS:', err);
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
