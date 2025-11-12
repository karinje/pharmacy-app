import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	calculatorStore,
	calculationResult,
	isCalculating,
	calculationProgress,
	calculationError
} from '$lib/stores/calculator';
import type { CalculationResult, CalculationProgress } from '$lib/types/calculation';

describe('Calculator Store', () => {
	const mockResult: CalculationResult = {
		id: 'test-123',
		input: {
			drugName: 'Metformin',
			instructions: 'Take 1 tablet twice daily',
			daysSupply: 30
		},
		rxnormData: {
			rxcui: '860975',
			name: 'Metformin 500 MG',
			confidence: 'high'
		},
		allProducts: [],
		activeProducts: [],
		inactiveProducts: [],
		parsing: {
			dosage: { amount: 1, unit: 'tablet' },
			frequency: { timesPerDay: 2 },
			route: 'oral',
			confidence: 'high',
			warnings: []
		},
		quantity: {
			dailyQuantity: 2,
			totalQuantityNeeded: 60,
			calculation: 'Test calculation',
			assumptions: [],
			uncertainties: []
		},
		optimization: {
			recommendedPackages: [],
			alternatives: [],
			rationale: 'Test rationale'
		},
		explanation: 'Test explanation',
		warnings: [],
		timestamp: new Date()
	};

	const mockProgress: CalculationProgress = {
		stage: 'calculating',
		message: 'Processing...',
		progress: 50
	};

	beforeEach(() => {
		calculatorStore.reset();
	});

	it('should initialize with null result', () => {
		const state = get(calculatorStore);
		expect(state.result).toBeNull();
		expect(state.progress).toBeNull();
		expect(state.isCalculating).toBe(false);
		expect(state.error).toBeNull();
	});

	it('should set calculating state', () => {
		calculatorStore.setCalculating(true);
		const state = get(calculatorStore);
		expect(state.isCalculating).toBe(true);
		expect(state.error).toBeNull();
	});

	it('should set progress', () => {
		calculatorStore.setProgress(mockProgress);
		const state = get(calculatorStore);
		expect(state.progress).toEqual(mockProgress);
	});

	it('should set result and clear calculating state', () => {
		calculatorStore.setCalculating(true);
		calculatorStore.setResult(mockResult);
		const state = get(calculatorStore);
		expect(state.result).toEqual(mockResult);
		expect(state.isCalculating).toBe(false);
		expect(state.progress).toBeNull();
		expect(state.error).toBeNull();
	});

	it('should set error and clear calculating state', () => {
		calculatorStore.setCalculating(true);
		calculatorStore.setError('Test error');
		const state = get(calculatorStore);
		expect(state.error).toBe('Test error');
		expect(state.isCalculating).toBe(false);
		expect(state.progress).toBeNull();
		expect(state.result).toBeNull();
	});

	it('should reset to initial state', () => {
		calculatorStore.setResult(mockResult);
		calculatorStore.setProgress(mockProgress);
		calculatorStore.setError('Test error');
		calculatorStore.reset();

		const state = get(calculatorStore);
		expect(state.result).toBeNull();
		expect(state.progress).toBeNull();
		expect(state.isCalculating).toBe(false);
		expect(state.error).toBeNull();
	});

	it('should provide derived calculationResult store', () => {
		calculatorStore.setResult(mockResult);
		const result = get(calculationResult);
		expect(result).toEqual(mockResult);
	});

	it('should provide derived isCalculating store', () => {
		calculatorStore.setCalculating(true);
		const calculating = get(isCalculating);
		expect(calculating).toBe(true);
	});

	it('should provide derived calculationProgress store', () => {
		calculatorStore.setProgress(mockProgress);
		const progress = get(calculationProgress);
		expect(progress).toEqual(mockProgress);
	});

	it('should provide derived calculationError store', () => {
		calculatorStore.setError('Test error');
		const error = get(calculationError);
		expect(error).toBe('Test error');
	});
});

