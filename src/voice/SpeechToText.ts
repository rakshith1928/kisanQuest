/**
 * SpeechToText.ts
 * Placeholder module for Google Cloud Speech-to-Text wrapper.
 * Records audio via expo-av and sends to Google Cloud STT for transcription.
 * Falls back to offline keyword matching when no connectivity.
 */

const HF_STT_ENDPOINT = 'https://api-inference.huggingface.co/models/openai/whisper-large-v3';
const HF_API_KEY = process.env.EXPO_PUBLIC_HF_API_KEY || null;

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
        if (!HF_API_KEY) {
            console.warn('[STT] No HF API key configured.');
            return null;
        }
        try {
            const { FileSystem } = require('expo-file-system');

            // Read as base64, convert to binary blob
            const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const binaryStr = atob(audioBase64);
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }

            const res = await fetch(HF_STT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'audio/wav',      // expo records as WAV/m4a — use audio/wav
                },
                body: bytes.buffer,
            });

            const data = await res.json();
            return data?.text || null;       // HF returns { text: "..." }
        } catch (err) {
            console.warn('[STT] HF transcription failed:', err);
            return null;
        }
    }
};

export default SpeechToText;
