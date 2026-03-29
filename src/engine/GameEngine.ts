/**
 * GameEngine.ts — Main engine orchestrator
 * Coordinates StateMachine, DecisionTree, and OutcomeCalculator
 * to drive the game loop.
 */

import { StateMachine, GameStateName } from './StateMachine';
import { DecisionTree, Scenario } from './DecisionTree';
import { OutcomeCalculator, OutcomeResult } from './OutcomeCalculator';

export interface PlayerFarm {
    name: string;
    crop: string | null;
    season: number;
}

export interface PlayerFinances {
    cash: number;
    debt: number;
    savings: number;
    insurance: boolean;
}

export interface PlayerScore {
    financialHealth: number;
    literacyPoints: number;
    badges: string[];
    xp: number;
    level: number;
    streak: number;
    unlockedSkills: string[];
}

export interface PlayerState {
    name: string;
    language: string;
    region: string;
    farm: PlayerFarm;
    finances: PlayerFinances;
    score: PlayerScore;
    completedScenarios: string[];
    seasonHistory: SeasonRecord[];
}

export interface SeasonRecord {
    season: number;
    finances: PlayerFinances;
    score: number;
}

export interface GameState {
    phase: GameStateName | null;
    player: PlayerState;
    scenario: Scenario | null;
    eventsCompleted: number;
}

const INITIAL_PLAYER_STATE: PlayerState = {
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
        xp: 0,
        level: 1,
        streak: 0,
        unlockedSkills: [],
    },
    completedScenarios: [],
    seasonHistory: [],
};

export class GameEngine {
    private stateMachine: StateMachine;
    public decisionTree: DecisionTree;
    private outcomeCalculator: OutcomeCalculator;
    private playerState: PlayerState;
    private currentScenario: Scenario | null;
    public eventsCompleted: number = 0;

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
    initGame(playerInfo: Partial<PlayerState> = {}): PlayerState {
        this.playerState = {
            ...INITIAL_PLAYER_STATE,
            ...playerInfo,
        };
        this.stateMachine.reset();
        this.eventsCompleted = 0;
        this.stateMachine.transition('ONBOARDING');
        return this.playerState;
    }

    /**
     * Get the current game state
     */
    getState(): GameState {
        return {
            phase: this.stateMachine.getCurrentState(),
            player: this.playerState,
            scenario: this.currentScenario,
            eventsCompleted: this.eventsCompleted,
        };
    }

    /**
     * Restore a full game state (e.g. from offline SQLite).
     * Unlike initGame(), this preserves phase, scenario, and all player progress.
     */
    loadState(state: GameState): void {
        this.playerState = state.player;
        this.currentScenario = state.scenario || null;
        this.eventsCompleted = state.eventsCompleted || 0;

        if (state.phase) {
            this.stateMachine.transition(state.phase);
        }
    }

    /**
     * Get current decision node
     */
    getCurrentNode() {
        return this.decisionTree.getCurrentNode();
    }

    /**
     * Get the state machine instance
     */
    getStateMachine(): StateMachine {
        return this.stateMachine;
    }

    /**
     * Process a player decision
     */
    processDecision(optionId: string): OutcomeResult | null {
        if (!this.currentScenario) return null;

        const outcome = this.outcomeCalculator.calculate(
            optionId,
            this.playerState as Parameters<OutcomeCalculator['calculate']>[1],
            this.currentScenario as Parameters<OutcomeCalculator['calculate']>[2]
        );

        // Apply financial impact
        if (outcome.financialChanges) {
            this.playerState.finances = {
                ...this.playerState.finances,
                ...outcome.financialChanges,
            };
        }

        // Update score
        this.playerState.score.financialHealth += outcome.healthDelta || 0;
        this.playerState.score.literacyPoints += 20 + (outcome.literacyPoints || 0);

        // Apply RPG Mechanisms: XP, Leveling, and Streaks
        this.playerState.score.xp += 150; // Base XP for decision

        if ((outcome.healthDelta || 0) > 0) {
            this.playerState.score.streak += 1;
            this.playerState.score.xp += this.playerState.score.streak * 50; // Streak bonus
        } else if ((outcome.healthDelta || 0) < 0) {
            this.playerState.score.streak = 0; // Break streak on poor choices
        }

        // Recalculate level
        this.playerState.score.level = Math.floor(this.playerState.score.xp / 1000) + 1;
        
        this.eventsCompleted += 1;

        return outcome;
    }

    /**
     * Add XP directly (e.g. from daily tasks like watering) and recalculate level
     */
    addXP(amount: number): void {
        this.playerState.score.xp += amount;
        this.playerState.score.level = Math.floor(this.playerState.score.xp / 1000) + 1;
    }

    /**
     * Advance to next season
     */
    advanceSeason(): void {
        this.playerState.seasonHistory.push({
            season: this.playerState.farm.season,
            finances: { ...this.playerState.finances },
            score: this.playerState.score.financialHealth,
        });
        this.playerState.farm.season += 1;
        this.eventsCompleted = 0; // Reset new season events
        this.currentScenario = null;
        this.decisionTree = new DecisionTree(); // reset the decision tree state
        this.stateMachine.transition('SEASON_START');
    }

    /**
     * Load a random scenario
     */
    async loadRandomScenario(): Promise<Scenario> {
        const scenarios = DecisionTree.getAvailableScenarios();
        const rand = scenarios[Math.floor(Math.random() * scenarios.length)];
        return await this.loadScenario(rand);
    }

    /**
     * Load a scenario by name
     */
    async loadScenario(scenarioName: string): Promise<Scenario> {
        this.currentScenario = await this.decisionTree.loadScenario(scenarioName);
        return this.currentScenario;
    }

    /**
     * Reset game to initial state
     */
    reset(): void {
        this.playerState = { ...INITIAL_PLAYER_STATE };
        this.currentScenario = null;
        this.stateMachine.transition('ONBOARDING');
    }
}

export default new GameEngine();
