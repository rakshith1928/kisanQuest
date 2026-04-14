import { PlayerState as FullPlayerState } from './GameEngine';

export type SeasonType = 'kharif' | 'rabi';
export type CropType = 'rice' | 'wheat' | 'cotton' | 'sugarcane';

export interface WeatherResult {
    type: string;
    seasonType: SeasonType;
    probability: number;
}

export interface FinancialImpact {
    cash?: number;
    debt?: number;
    savings?: number;
    insurance?: boolean;
}

export interface FinancialState {
    cash: number;
    debt: number;
    savings: number;
    insurance: boolean;
}

export interface OutcomeResult {
    success: boolean;
    financialChanges?: FinancialState;
    weather?: WeatherResult;
    yieldMultiplier?: number;
    healthDelta?: number;
    literacyPoints?: number;
    message: string;
    lesson?: string | null;
}

interface ScenarioOption {
    id?: string;
    financialImpact?: FinancialImpact;
    outcome?: string;
    lesson?: string;
    healthDelta?: number;
}

interface ScenarioNode {
    id: string;
    options?: ScenarioOption[];
}

interface Scenario {
    nodes: ScenarioNode[];
}

// Weather probability weights based on Indian monsoon patterns
const WEATHER_PATTERNS: Record<SeasonType, Record<string, number>> = {
    kharif: {
        good_monsoon: 0.4,
        normal: 0.35,
        drought: 0.15,
        flood: 0.1,
    },
    rabi: {
        good_winter: 0.5,
        normal: 0.35,
        cold_wave: 0.1,
        unseasonal_rain: 0.05,
    },
};

// Crop yield multipliers based on weather
const CROP_YIELDS: Record<string, Record<string, number>> = {
    rice: { good_monsoon: 1.3, normal: 1.0, drought: 0.3, flood: 0.5 },
    wheat: { good_winter: 1.2, normal: 1.0, cold_wave: 0.6, unseasonal_rain: 0.4 },
    cotton: { good_monsoon: 1.4, normal: 1.0, drought: 0.2, flood: 0.4 },
    sugarcane: { good_monsoon: 1.25, normal: 1.0, drought: 0.4, flood: 0.6 },
};

export class OutcomeCalculator {
    private lastWeather: WeatherResult | null;
    private lastYield: number | null;

    constructor() {
        this.lastWeather = null;
        this.lastYield = null;
    }

    /**
     * Calculate mandi price dynamically based on random fluctuation + skills
     */
    calculateMandiPrice(baseRevenue: number, unlockedSkills: string[]): number {
        // Market fluctuation +/- 15%
        const fluctuation = 0.85 + (Math.random() * 0.30);
        
        // RPG SKILL: Negotiation (+15% to final market sale)
        const skillBonus = unlockedSkills.includes('Negotiation') ? 1.15 : 1.0;

        return Math.floor(baseRevenue * fluctuation * skillBonus);
    }

    /**
     * Calculate outcome of a player decision
     */
    calculate(optionId: string, playerState: FullPlayerState, scenario: Scenario): OutcomeResult {
        const option = this._findOption(optionId, scenario);
        if (!option) {
            return { success: false, message: 'Invalid option' };
        }

        const impact = option.financialImpact || {};
        const weather = this.generateWeather(playerState.farm?.season || 1);
        const yieldMultiplier = this.getCropYield(
            playerState.farm?.crop || 'rice',
            weather.type
        );

        // Calculate financial changes
        let cashChange = (impact.cash || 0) * yieldMultiplier;
        let debtChange = impact.debt || 0;
        let savingsChange = impact.savings || 0;

        const skills = playerState.score?.unlockedSkills || [];
        
        if (impact.cash && impact.cash > 0) {
            cashChange = this.calculateMandiPrice(impact.cash * yieldMultiplier, skills);
            // Digital Payments Skill: Earn 5% cashback/subsidy on positive cash flow
            if (skills.includes('Digital Payments')) {
                cashChange += Math.floor(cashChange * 0.05);
            }
        }

        // Insurance Literacy Skill: 25% discount on purchasing insurance
        if (impact.cash && impact.cash < 0 && impact.insurance) {
            if (skills.includes('Insurance Literacy')) {
                cashChange *= 0.75;
            }
        }

        // Fraud Detection Skill: Cap catastrophic losses
        if (impact.cash && impact.cash < -10000) {
            if (skills.includes('Fraud Detection')) {
                // Caught the fraud early!
                cashChange = -1000;
            }
        }

        // Budget Planning Skill: Prevent overdraft penalties
        let overdraftPenalty = 0;
        if (playerState.finances.cash + cashChange < 0) {
            if (!skills.includes('Budget Planning')) {
                overdraftPenalty = -2000; // standard penalty
            }
        }

        const financialChanges: FinancialState = {
            cash: Math.round(playerState.finances.cash + cashChange + overdraftPenalty),
            debt: Math.max(0, playerState.finances.debt + debtChange),
            savings: Math.max(0, playerState.finances.savings + savingsChange),
            insurance: impact.insurance !== undefined
                ? impact.insurance
                : playerState.finances.insurance,
        };

        // Calculate quality score
        const qualityScore = this._assessDecisionQuality(option, playerState);

        return {
            success: true,
            financialChanges,
            weather,
            yieldMultiplier,
            healthDelta: qualityScore,
            literacyPoints: Math.abs(qualityScore) * 10,
            message: option.outcome || 'Decision recorded.',
            lesson: option.lesson || null,
        };
    }

    /**
     * Generate random weather based on season
     */
    generateWeather(seasonNumber: number): WeatherResult {
        const seasonType: SeasonType = seasonNumber % 2 === 1 ? 'kharif' : 'rabi';
        const patterns = WEATHER_PATTERNS[seasonType];
        const random = Math.random();

        let cumulative = 0;
        for (const [type, probability] of Object.entries(patterns)) {
            cumulative += probability;
            if (random <= cumulative) {
                this.lastWeather = { type, seasonType, probability };
                return this.lastWeather;
            }
        }

        // Fallback
        const fallbackType = Object.keys(patterns)[0];
        this.lastWeather = { type: fallbackType, seasonType, probability: patterns[fallbackType] };
        return this.lastWeather;
    }

    /**
     * Get crop yield multiplier based on weather
     */
    getCropYield(cropType: string, weatherType: string): number {
        const yields = CROP_YIELDS[cropType?.toLowerCase()];
        if (!yields) return 1.0;
        this.lastYield = yields[weatherType] || 1.0;
        return this.lastYield;
    }

    /**
     * Assess decision quality (returns -10 to +10 health score delta)
     */
    private _assessDecisionQuality(option: ScenarioOption, playerState: FullPlayerState): number {
        // If the scenario JSON explicitly defines a healthDelta, use it directly.
        // This is how we mark specific options as "wrong" (-10) or "right" (+10).
        if (option.healthDelta !== undefined) {
            return option.healthDelta;
        }

        let score = 0;
        const impact = option.financialImpact || {};

        // Positive: savings, insurance, low debt
        if ((impact.savings || 0) > 0) score += 3;
        if (impact.insurance === true) score += 4;
        if ((impact.debt || 0) < 0) score += 2; // paying off debt

        // Negative: high debt, no insurance
        if ((impact.debt || 0) > 2000) score -= 5;
        if ((impact.debt || 0) > 0 && playerState.finances.debt > 5000) score -= 7;

        // Doing nothing in a crisis is risky
        if (Object.keys(impact).length === 0) score -= 2;

        // Clamp to range
        return Math.max(-15, Math.min(15, score));
    }

    /**
     * Find option in scenario by ID
     */
    private _findOption(optionId: string, scenario: Scenario): ScenarioOption | null {
        if (!scenario || !scenario.nodes) return null;
        for (const node of scenario.nodes) {
            if (node.options) {
                const found = node.options.find(o => o.id === optionId);
                if (found) return found;
            }
        }
        return null;
    }
}

export default OutcomeCalculator;
