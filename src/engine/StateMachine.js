/**
 * StateMachine.js — Game flow state machine
 * Implements the 6-step game cycle:
 * ONBOARDING → FARM_CREATION → SEASON_START → FINANCIAL_EVENT → DECISION_POINT → HARVEST_REVIEW
 */

const GAME_STATES = {
    ONBOARDING: {
        name: 'ONBOARDING',
        allowedTransitions: ['FARM_CREATION'],
        voicePrompt: 'welcome_message',
    },
    FARM_CREATION: {
        name: 'FARM_CREATION',
        allowedTransitions: ['SEASON_START'],
        voicePrompt: 'create_farm_prompt',
    },
    SEASON_START: {
        name: 'SEASON_START',
        allowedTransitions: ['FINANCIAL_EVENT'],
        voicePrompt: 'season_begin_prompt',
    },
    FINANCIAL_EVENT: {
        name: 'FINANCIAL_EVENT',
        allowedTransitions: ['DECISION_POINT'],
        voicePrompt: 'event_notification',
    },
    DECISION_POINT: {
        name: 'DECISION_POINT',
        allowedTransitions: ['HARVEST_REVIEW', 'FINANCIAL_EVENT'],
        voicePrompt: 'decision_prompt',
    },
    HARVEST_REVIEW: {
        name: 'HARVEST_REVIEW',
        allowedTransitions: ['SEASON_START', 'ONBOARDING'],
        voicePrompt: 'harvest_results',
    },
};

export class StateMachine {
    constructor() {
        this.currentState = null;
        this.stateHistory = [];
        this.listeners = [];
    }

    /**
     * Get the current state name
     */
    getCurrentState() {
        return this.currentState?.name || null;
    }

    /**
     * Get allowed transitions from current state
     */
    getAllowedTransitions() {
        if (!this.currentState) return Object.keys(GAME_STATES);
        return this.currentState.allowedTransitions;
    }

    /**
     * Transition to a new state
     */
    transition(stateName) {
        const newState = GAME_STATES[stateName];
        if (!newState) {
            throw new Error(`Invalid state: ${stateName}`);
        }

        // Validate transition is allowed
        if (this.currentState) {
            const allowed = this.currentState.allowedTransitions;
            if (!allowed.includes(stateName)) {
                throw new Error(
                    `Cannot transition from ${this.currentState.name} to ${stateName}. ` +
                    `Allowed: ${allowed.join(', ')}`
                );
            }
        }

        const previousState = this.currentState;
        this.currentState = newState;
        this.stateHistory.push({
            from: previousState?.name || null,
            to: stateName,
            timestamp: Date.now(),
        });

        // Notify listeners
        this.listeners.forEach(listener =>
            listener(newState, previousState)
        );

        return newState;
    }

    /**
     * Subscribe to state changes
     */
    onStateChange(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    /**
     * Get the voice prompt key for the current state
     */
    getVoicePrompt() {
        return this.currentState?.voicePrompt || null;
    }

    /**
     * Get full state history
     */
    getHistory() {
        return [...this.stateHistory];
    }

    /**
     * Reset the state machine
     */
    reset() {
        this.currentState = null;
        this.stateHistory = [];
    }
}

export default StateMachine;
