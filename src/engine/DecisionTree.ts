/**
 * DecisionTree.ts — JSON decision-tree processor
 * Loads and traverses scenario JSON files.
 * Each node has: id, prompt, voicePrompt, options[], nextNode
 */

// Static scenario imports (bundled with the app for offline use)
import monsoonCrisis from './scenarios/monsoon_crisis.json';
import marketPrice from './scenarios/market_price.json';
import digitalPayment from './scenarios/digital_payment.json';
import savingsChallenge from './scenarios/savings_challenge.json';
import loanTrap from './scenarios/loan_trap.json';
import digitalSubsidy from './scenarios/digital_subsidy.json';
import harvestBargain from './scenarios/harvest_bargain.json';
import equipmentLoan from './scenarios/equipment_loan.json';
import floodInsurance from './scenarios/flood_insurance.json';
import upiPayment from './scenarios/upi_payment.json';
import fakeScheme from './scenarios/fake_scheme.json';

export interface ScenarioOption {
    id?: string;
    label: string;
    voiceKeywords?: Record<string, string[]>;
    outcome?: string;
    lesson?: string;
    financialImpact?: {
        cash?: number;
        debt?: number;
        savings?: number;
        insurance?: boolean;
    };
    nextNode?: string;
}

export interface ScenarioNode {
    id: string;
    prompt: string;
    voicePrompt?: string;
    options?: ScenarioOption[];
    nextNode?: string;
}

export interface Scenario {
    id: string;
    title: string;
    description?: string;
    season?: string;
    startNode?: string;
    nodes: ScenarioNode[];
}

export interface DecisionResult {
    chosenOption: ScenarioOption;
    nextNode: ScenarioNode | null;
    isEnd: boolean;
}

interface DecisionHistoryEntry {
    nodeId: string;
    chosenOption: number;
    label: string;
    timestamp: number;
}

type ScenarioName = string;

const SCENARIO_MAP: Record<ScenarioName, Scenario> = {
    monsoon_crisis: monsoonCrisis as unknown as Scenario,
    market_price: marketPrice as unknown as Scenario,
    digital_payment: digitalPayment as unknown as Scenario,
    savings_challenge: savingsChallenge as unknown as Scenario,
    loan_trap: loanTrap as unknown as Scenario,
    digital_subsidy: digitalSubsidy as unknown as Scenario,
    harvest_bargain: harvestBargain as unknown as Scenario,
    equipment_loan: equipmentLoan as unknown as Scenario,
    flood_insurance: floodInsurance as unknown as Scenario,
    upi_payment: upiPayment as unknown as Scenario,
    fake_scheme: fakeScheme as unknown as Scenario,
};

export class DecisionTree {
    private currentScenario: Scenario | null;
    private currentNode: ScenarioNode | null;
    private decisionHistory: DecisionHistoryEntry[];

    constructor() {
        this.currentScenario = null;
        this.currentNode = null;
        this.decisionHistory = [];
    }

    /**
     * Load a scenario by name
     */
    async loadScenario(scenarioName: string): Promise<Scenario> {
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
    getCurrentNode(): ScenarioNode | null {
        return this.currentNode;
    }

    /**
     * Find a node by ID
     */
    findNode(nodeId: string): ScenarioNode | null {
        if (!this.currentScenario) return null;
        return this.currentScenario.nodes.find(n => n.id === nodeId) || null;
    }

    /**
     * Choose an option and advance to next node
     */
    chooseOption(optionIndex: number): DecisionResult | null {
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
    matchVoiceKeyword(keyword: string, language: string = 'hi'): number {
        if (!this.currentNode || !this.currentNode.options) return -1;

        const normalizedKeyword = keyword.toLowerCase().trim();
        return this.currentNode.options.findIndex(option => {
            if (!option.voiceKeywords) return false;
            
            // If it's an array (old format), check all keywords
            if (Array.isArray(option.voiceKeywords)) {
                return option.voiceKeywords.some(kw => kw.toLowerCase().trim() === normalizedKeyword);
            }
            
            // If it's an object (new format), check current language
            const keywords = option.voiceKeywords[language] || [];
            return keywords.some(kw => kw.toLowerCase().trim() === normalizedKeyword);
        });
    }

    /**
     * Get decision history
     */
    getHistory(): DecisionHistoryEntry[] {
        return [...this.decisionHistory];
    }

    /**
     * Get available scenario names
     */
    static getAvailableScenarios(): string[] {
        return Object.keys(SCENARIO_MAP);
    }
}

export default DecisionTree;
