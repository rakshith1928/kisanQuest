/**
 * SpeechToText.ts
 * Placeholder module for Google Cloud Speech-to-Text wrapper.
 * Records audio via expo-av and sends to Google Cloud STT for transcription.
 * Falls back to offline keyword matching when no connectivity.
 */

// Constants removed: backend handles Hugging Face proxy now.

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
     * Transcribe an audio file using the Node.js backend proxy.
     * Falls back to offline keyword matching when no connectivity (not implemented here yet).
     */
    async transcribe(audioUri: string, langCode: string = 'hi'): Promise<string | null> {
        try {
            const { FileSystem } = require('expo-file-system');
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            const token = await AsyncStorage.getItem('token') || '';
            const { BASE_URL } = require('../config/api');

            // Read as base64 string directly
            const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const res = await fetch(`${BASE_URL}/api/voice/stt`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ audio: audioBase64, languageCode: langCode }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    console.warn('[STT] Unauthorized. Are you logged in?');
                }
                throw new Error(`Server responded with ${res.status}`);
            }

            const data = await res.json();
            return data?.transcript || null;       // server returns { transcript: "..." }
        } catch (err) {
            console.warn('[STT] Backend transcription proxy failed:', err);
            return null;
        }
    }
};

export default SpeechToText;
