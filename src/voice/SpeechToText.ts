/**
 * SpeechToText.ts
 * Placeholder module for Google Cloud Speech-to-Text wrapper.
 * Records audio via expo-av and sends to Google Cloud STT for transcription.
 * Falls back to offline keyword matching when no connectivity.
 */

const GOOGLE_STT_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';
const API_KEY: string | null = null;

interface RecordingInstance {
    stopAndUnloadAsync: () => Promise<void>;
    getURI: () => string | null;
}

let currentRecording: RecordingInstance | null = null;

const SpeechToText = {
    /**
     * Start recording audio for speech recognition.
     */
    async startRecording(): Promise<void> {
        try {
            const { Audio } = require('expo-av');
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            currentRecording = recording;
        } catch (err) {
            console.error('[STT] Failed to start recording:', err);
        }
    },

    /**
     * Stop recording and return the audio URI.
     */
    async stopRecording(): Promise<string | null> {
        if (!currentRecording) return null;
        try {
            await currentRecording.stopAndUnloadAsync();
            const uri = currentRecording.getURI();
            currentRecording = null;
            return uri;
        } catch (err) {
            console.error('[STT] Failed to stop recording:', err);
            currentRecording = null;
            return null;
        }
    },

    /**
     * Transcribe an audio file using Google Cloud STT.
     * Returns null if offline or if API key is not configured.
     */
    async transcribe(audioUri: string, langCode: string = 'hi'): Promise<string | null> {
        if (!API_KEY) {
            console.warn('[STT] No API key configured, cannot transcribe.');
            return null;
        }

        try {
            // Read audio file as base64
            const { FileSystem } = require('expo-file-system');
            const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const languageMap: Record<string, string> = {
                hi: 'hi-IN',
                en: 'en-IN',
                mr: 'mr-IN',
                ta: 'ta-IN',
                te: 'te-IN',
                kn: 'kn-IN',
            };

            const res = await fetch(`${GOOGLE_STT_ENDPOINT}?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config: {
                        encoding: 'LINEAR16',
                        sampleRateHertz: 44100,
                        languageCode: languageMap[langCode] || 'hi-IN',
                    },
                    audio: { content: audioBase64 },
                }),
            });

            const data = await res.json();
            const transcript = data?.results?.[0]?.alternatives?.[0]?.transcript || null;
            return transcript;
        } catch (err) {
            console.warn('[STT] Transcription failed (possibly offline):', err);
            return null;
        }
    },
};

export default SpeechToText;
