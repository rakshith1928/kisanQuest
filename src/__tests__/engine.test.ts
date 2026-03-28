/**
 * KisanQuest Engine Tests
 * Focus: Decision flow, OutcomeCalculator (money + score), State transitions
 * Goal: 8 solid tests that catch real logic bugs — hackathon quality
 */

import { OutcomeCalculator } from '../engine/OutcomeCalculator';
import { StateMachine } from '../engine/StateMachine';
import { DecisionTree } from '../engine/DecisionTree';

import { PlayerState } from '../engine/GameEngine';

// ─── Shared test fixtures ───────────────────────────────────────────────────

const BASE_FINANCES = {
  cash: 10000,
  debt: 0,
  savings: 0,
  insurance: false,
};

const MOCK_PLAYER: PlayerState = {
    name: 'Test',
    language: 'en',
    region: 'North',
    farm: { name: 'TestFarm', crop: 'rice', season: 1 },
    finances: { ...BASE_FINANCES },
    score: { financialHealth: 50, literacyPoints: 0, badges: [], xp: 0, level: 1, streak: 0, unlockedSkills: [] },
    completedScenarios: [],
    seasonHistory: []
};

const mockScenario = {
  id: 'test_scenario',
  title: 'Test',
  nodes: [
    {
      id: 'node_1',
      prompt: 'What do you do?',
      options: [
        {
          id: 'opt_insurance',
          label: 'Buy insurance',
          financialImpact: { cash: -3000, insurance: true },
          outcome: 'Insurance purchased.',
          lesson: 'Protect your crop.',
        },
        {
          id: 'opt_borrow',
          label: 'Borrow from moneylender',
          financialImpact: { cash: 5000, debt: 8000 },
          outcome: 'Loan taken.',
        },
        {
          id: 'opt_save',
          label: 'Put money in savings',
          financialImpact: { savings: 2000 },
          outcome: 'Savings deposited.',
        },
        {
          id: 'opt_repay',
          label: 'Repay part of debt',
          financialImpact: { debt: -5000 },
          outcome: 'Debt reduced.',
        },
      ],
    },
  ],
};

// ─── OutcomeCalculator Tests ────────────────────────────────────────────────

describe('OutcomeCalculator — money changes', () => {
  let calc: OutcomeCalculator;

  beforeEach(() => {
    calc = new OutcomeCalculator();
    // Freeze Math.random so weather is deterministic (always "good_monsoon")
    jest.spyOn(Math, 'random').mockReturnValue(0.2);
  });

  afterEach(() => jest.restoreAllMocks());

  test('1. Insurance option: cash decreases, insurance flag set to true', () => {
    const result = calc.calculate(
      'opt_insurance',
      { ...MOCK_PLAYER, finances: { ...BASE_FINANCES } },
      mockScenario as any,
    );

    expect(result.success).toBe(true);
    expect(result.financialChanges!.insurance).toBe(true);
    expect(result.financialChanges!.cash).toBeLessThan(BASE_FINANCES.cash);
  });

  test('2. Borrowing option: debt increases, cash increases', () => {
    const result = calc.calculate(
      'opt_borrow',
      { ...MOCK_PLAYER, finances: { ...BASE_FINANCES } },
      mockScenario as any,
    );

    expect(result.success).toBe(true);
    expect(result.financialChanges!.debt).toBeGreaterThan(0);
    expect(result.financialChanges!.cash).toBeGreaterThan(BASE_FINANCES.cash);
  });

  test('3. Savings option: savings balance increases, never goes negative', () => {
    const result = calc.calculate(
      'opt_save',
      { ...MOCK_PLAYER, finances: { ...BASE_FINANCES, savings: 500 } },
      mockScenario as any,
    );

    expect(result.financialChanges!.savings).toBeGreaterThan(500);
    expect(result.financialChanges!.savings).toBeGreaterThanOrEqual(0);
  });

  test('4. Debt repayment: debt cannot drop below zero', () => {
    const result = calc.calculate(
      'opt_repay',
      { ...MOCK_PLAYER, finances: { ...BASE_FINANCES, debt: 2000 } },
      mockScenario as any,
    );

    expect(result.financialChanges!.debt).toBe(0);
  });

  test('5. Invalid optionId returns failure', () => {
    const result = calc.calculate('nonexistent_id', MOCK_PLAYER, mockScenario as any);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid option/i);
  });

  test('6. Score: insurance decision earns positive healthDelta', () => {
    const result = calc.calculate(
      'opt_insurance',
      { ...MOCK_PLAYER, finances: { ...BASE_FINANCES } },
      mockScenario as any,
    );

    expect(result.healthDelta).toBeGreaterThan(0);
    expect(result.literacyPoints).toBeGreaterThan(0);
  });
});

// ─── StateMachine Tests ─────────────────────────────────────────────────────

describe('StateMachine — state transitions', () => {
  let sm: StateMachine;

  beforeEach(() => {
    sm = new StateMachine();
  });

  test('7. Valid linear flow: ONBOARDING → FARM_CREATION → SEASON_START', () => {
    sm.transition('ONBOARDING');
    expect(sm.getCurrentState()).toBe('ONBOARDING');

    sm.transition('FARM_CREATION');
    expect(sm.getCurrentState()).toBe('FARM_CREATION');

    sm.transition('SEASON_START');
    expect(sm.getCurrentState()).toBe('SEASON_START');
  });

  test('8. Invalid transition throws an error (no skipping states)', () => {
    sm.transition('ONBOARDING');
    // Cannot jump from ONBOARDING directly to DECISION_POINT
    expect(() => sm.transition('DECISION_POINT')).toThrow(/Cannot transition/);
  });
});

// ─── DecisionTree Tests ─────────────────────────────────────────────────────

describe('DecisionTree — decision flow', () => {
  let tree: DecisionTree;

  test('9. Loads monsoon_crisis scenario and starts at first node', async () => {
    tree = new DecisionTree();
    const scenario = await tree.loadScenario('monsoon_crisis');

    expect(scenario.id).toBe('monsoon_crisis');
    const node = tree.getCurrentNode();
    expect(node).not.toBeNull();
    expect(node!.options!.length).toBeGreaterThan(0);
  });

  test('10. Choosing option advances to the correct next node (mc_2a — insurance outcome)', async () => {
    tree = new DecisionTree();
    await tree.loadScenario('monsoon_crisis');

    // Option 0 = "Take crop insurance" → nextNode "mc_2a"
    const result = tree.chooseOption(0);
    expect(result).not.toBeNull();
    expect(result!.chosenOption.id).toBe('A');
    // mc_2a is an outcome node that exists in the scenario; next node should be found
    expect(result!.nextNode).not.toBeNull();
    expect(result!.nextNode!.id).toBe('mc_2a');
    // Decision history should have one entry
    expect(tree.getHistory()).toHaveLength(1);
  });
});
