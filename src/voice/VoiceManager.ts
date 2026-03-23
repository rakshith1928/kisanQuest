import SpeechToText from './SpeechToText';
import TextToSpeech from './TextToSpeech';
import VoiceCommands from './VoiceCommands';
import { GameAction } from './VoiceCommands';
import { TTSOptions } from './TextToSpeech';

/**
 * VoiceManager.ts
 * Central orchestrator for all voice I/O in KisanQuest.
 * Coordinates STT → intent extraction → action mapping → TTS responses.
 */

type ActionCallback = (action: GameAction) => void;

class VoiceManager {
    private language: string;
    private isListening: boolean;
    private onActionCallback: ActionCallback | null;

    constructor() {
        this.language = 'hi';
        this.isListening = false;
        this.onActionCallback = null;
    }

    /**
     * Set the active language for all voice operations.
     */
    setLanguage(langCode: string): void {
        this.language = langCode;
    }

    /**
     * Register a callback fired when a voice command is recognized.
     */
    onAction(callback: ActionCallback): void {
        this.onActionCallback = callback;
    }

    // ─── Text-to-Speech ───────────────────────────────────────────────────────

    /**
     * Speak text in the current language.
     */
    async speak(text: string, opts: TTSOptions = {}): Promise<void> {
        await TextToSpeech.speak(text, this.language, opts);
    }

    /**
     * Speak text and wait until finished.
     */
    speakAsync(text: string): Promise<void> {
        return new Promise((resolve) => {
            TextToSpeech.speak(text, this.language, { onDone: resolve });
        });
    }

    async stopSpeaking(): Promise<void> {
        await TextToSpeech.stop();
    }

    // ─── Speech-to-Text ───────────────────────────────────────────────────────

    /**
     * Start listening for a voice command.
     * Begins recording; call stopListening() to process.
     */
    async startListening(): Promise<void> {
        if (this.isListening) return;
        this.isListening = true;
        await SpeechToText.startRecording();
    }

    /**
     * Stop listening, transcribe audio, match command, and fire callback.
     */
    async stopListening(): Promise<GameAction | null> {
        if (!this.isListening) return null;
        this.isListening = false;

        const uri = await SpeechToText.stopRecording();
        if (!uri) return null;

        // Attempt cloud transcription; returns null if offline
        const transcript = await SpeechToText.transcribe(uri, this.language);

        let action: GameAction | null = null;
        if (transcript) {
            action = VoiceCommands.match(transcript, this.language);
        }

        if (action && this.onActionCallback) {
            this.onActionCallback(action);
        }

        return action;
    }

    /**
     * Convenience: record for a fixed duration and return matched action.
     */
    async listenForDuration(durationMs: number = 3000): Promise<GameAction | null> {
        await this.startListening();
        await new Promise(r => setTimeout(r, durationMs));
        return this.stopListening();
    }

    /**
     * Match a transcript manually (for testing or custom STT input).
     */
    matchCommand(transcript: string): GameAction | null {
        return VoiceCommands.match(transcript, this.language);
    }

    /**
     * Get hint keywords for a given game action in the current language.
     * Used to show on-screen prompts like "Say: बीमा / insurance"
     */
    getKeywordsForAction(action: GameAction): string[] {
        return VoiceCommands.getKeywordsForAction(action, this.language);
    }

    async isSpeaking(): Promise<boolean> {
        return TextToSpeech.isSpeaking();
    }
}

export default new VoiceManager();
