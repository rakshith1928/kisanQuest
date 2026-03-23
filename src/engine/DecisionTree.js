/**
 * DecisionTree.js — JSON decision-tree processor
 * Loads and traverses scenario JSON files.
 * Each node has: id, prompt, voicePrompt, options[], nextNode
 */

// Static scenario imports (bundled with the app for offline use)
import monsoonCrisis from './scenarios/monsoon_crisis.json';
import marketPrice from './scenarios/market_price.json';
import digitalPayment from './scenarios/digital_payment.json';
import savingsChallenge from './scenarios/savings_challenge.json';
import loanTrap from './scenarios/loan_trap.json';

const SCENARIO_MAP = {
    monsoon_crisis: monsoonCrisis,
    market_price: marketPrice,
    digital_payment: digitalPayment,
    savings_challenge: savingsChallenge,
    loan_trap: loanTrap,
};

export class DecisionTree {
    constructor() {
        this.currentScenario = null;
        this.currentNode = null;
        this.decisionHistory = [];
    }

    /**
     * Load a scenario by name
     */
    async loadScenario(scenarioName) {
        const scenario = SCENARIO_MAP[scenarioName];
        if (!scenario) {
            throw new Error(`Unknown scenario: ${scenarioName}`);
        }
        this.currentScenario = scenario;
        this.currentNode = scenario.startNode
            ? this.findNode(scenario.startNode)
            : scenario.nodes[0];
        this.decisionHistory = [];
        return this.currentScenario;
    }

    /**
     * Get current decision node
     */
    getCurrentNode() {
        return this.currentNode;
    }

    /**
     * Find a node by ID
     */
    findNode(nodeId) {
        if (!this.currentScenario) return null;
        return this.currentScenario.nodes.find(n => n.id === nodeId) || null;
    }

    /**
     * Choose an option and advance to next node
     */
    chooseOption(optionIndex) {
        if (!this.currentNode || !this.currentNode.options) return null;

        const option = this.currentNode.options[optionIndex];
        if (!option) {
            throw new Error(`Invalid option index: ${optionIndex}`);
        }

        this.decisionHistory.push({
            nodeId: this.currentNode.id,
            chosenOption: optionIndex,
            label: option.label,
            timestamp: Date.now(),
        });

        // Navigate to the next node
        const nextNodeId = option.nextNode || this.currentNode.nextNode;
        if (nextNodeId) {
            this.currentNode = this.findNode(nextNodeId);
        } else {
            this.currentNode = null; // End of scenario
        }

        return {
            chosenOption: option,
            nextNode: this.currentNode,
            isEnd: this.currentNode === null,
        };
    }

    /**
     * Match a voice keyword to an option
     */
    matchVoiceKeyword(keyword, language = 'hi') {
        if (!this.currentNode || !this.currentNode.options) return -1;

        const normalizedKeyword = keyword.toLowerCase().trim();
        return this.currentNode.options.findIndex(option => {
            const keywords = option.voiceKeywords?.[language] || [];
            return keywords.some(kw => kw.toLowerCase().trim() === normalizedKeyword);
        });
    }

    /**
     * Get decision history
     */
    getHistory() {
        return [...this.decisionHistory];
    }

    /**
     * Get available scenario names
     */
    static getAvailableScenarios() {
        return Object.keys(SCENARIO_MAP);
    }
}

export default DecisionTree;
