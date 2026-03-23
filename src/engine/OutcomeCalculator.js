/**
 * OutcomeCalculator.js — Probabilistic outcome engine
 * Factors in: player finances, weather randomness, crop yields, decision quality
 */

// Weather probability weights based on Indian monsoon patterns
const WEATHER_PATTERNS = {
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
const CROP_YIELDS = {
    rice: { good_monsoon: 1.3, normal: 1.0, drought: 0.3, flood: 0.5 },
    wheat: { good_winter: 1.2, normal: 1.0, cold_wave: 0.6, unseasonal_rain: 0.4 },
    cotton: { good_monsoon: 1.4, normal: 1.0, drought: 0.2, flood: 0.4 },
    sugarcane: { good_monsoon: 1.25, normal: 1.0, drought: 0.4, flood: 0.6 },
};

export class OutcomeCalculator {
    constructor() {
        this.lastWeather = null;
        this.lastYield = null;
    }

    /**
     * Calculate outcome of a player decision
     */
    calculate(optionId, playerState, scenario) {
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
        const cashChange = (impact.cash || 0) * yieldMultiplier;
        const debtChange = impact.debt || 0;
        const savingsChange = impact.savings || 0;

        const financialChanges = {
            cash: Math.round(playerState.finances.cash + cashChange),
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
    generateWeather(seasonNumber) {
        const seasonType = seasonNumber % 2 === 1 ? 'kharif' : 'rabi';
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
    getCropYield(cropType, weatherType) {
        const yields = CROP_YIELDS[cropType?.toLowerCase()];
        if (!yields) return 1.0;
        this.lastYield = yields[weatherType] || 1.0;
        return this.lastYield;
    }

    /**
     * Assess decision quality (returns -10 to +10 health score delta)
     */
    _assessDecisionQuality(option, playerState) {
        let score = 0;
        const impact = option.financialImpact || {};

        // Positive: savings, insurance, low debt
        if (impact.savings > 0) score += 3;
        if (impact.insurance === true) score += 4;
        if (impact.debt < 0) score += 2; // paying off debt

        // Negative: high debt, no insurance
        if (impact.debt > 5000) score -= 3;
        if (impact.debt > 0 && playerState.finances.debt > 10000) score -= 4;

        // Clamp to range
        return Math.max(-10, Math.min(10, score));
    }

    /**
     * Find option in scenario by ID
     */
    _findOption(optionId, scenario) {
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
