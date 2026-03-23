/**
 * GameEngine.js — Main engine orchestrator
 * Coordinates StateMachine, DecisionTree, and OutcomeCalculator
 * to drive the game loop.
 */

import { StateMachine } from './StateMachine';
import { DecisionTree } from './DecisionTree';
import { OutcomeCalculator } from './OutcomeCalculator';

const INITIAL_PLAYER_STATE = {
    name: '',
    language: 'hi',
    region: '',
    farm: {
        name: '',
        crop: null,
        season: 1,
    },
    finances: {
        cash: 10000,
        debt: 0,
        savings: 0,
        insurance: false,
    },
    score: {
        financialHealth: 50,
        literacyPoints: 0,
        badges: [],
    },
    completedScenarios: [],
    seasonHistory: [],
};

export class GameEngine {
    constructor() {
        this.stateMachine = new StateMachine();
        this.decisionTree = new DecisionTree();
        this.outcomeCalculator = new OutcomeCalculator();
        this.playerState = { ...INITIAL_PLAYER_STATE };
        this.currentScenario = null;
    }

    /**
     * Initialize a new game with player info
     */
    initGame(playerInfo = {}) {
        this.playerState = {
            ...INITIAL_PLAYER_STATE,
            ...playerInfo,
        };
        this.stateMachine.transition('ONBOARDING');
        return this.playerState;
    }

    /**
     * Get the current game state
     */
    getState() {
        return {
            phase: this.stateMachine.getCurrentState(),
            player: this.playerState,
            scenario: this.currentScenario,
        };
    }

    /**
     * Process a player decision
     */
    processDecision(optionId) {
        if (!this.currentScenario) return null;

        const outcome = this.outcomeCalculator.calculate(
            optionId,
            this.playerState,
            this.currentScenario
        );

        // Apply financial impact
        this.playerState.finances = {
            ...this.playerState.finances,
            ...outcome.financialChanges,
        };

        // Update score
        this.playerState.score.financialHealth += outcome.healthDelta;
        this.playerState.score.literacyPoints += outcome.literacyPoints;

        return outcome;
    }

    /**
     * Advance to next season
     */
    advanceSeason() {
        this.playerState.seasonHistory.push({
            season: this.playerState.farm.season,
            finances: { ...this.playerState.finances },
            score: this.playerState.score.financialHealth,
        });
        this.playerState.farm.season += 1;
        this.stateMachine.transition('SEASON_START');
    }

    /**
     * Load a scenario by name
     */
    async loadScenario(scenarioName) {
        this.currentScenario = await this.decisionTree.loadScenario(scenarioName);
        return this.currentScenario;
    }

    /**
     * Reset game to initial state
     */
    reset() {
        this.playerState = { ...INITIAL_PLAYER_STATE };
        this.currentScenario = null;
        this.stateMachine.transition('ONBOARDING');
    }
}

export default new GameEngine();
