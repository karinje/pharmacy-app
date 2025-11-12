import { writable, derived } from 'svelte/store';
import type { CalculatorState, CalculationRequest } from '$lib/types/calculator';

function createCalculatorStore() {
	const initialState: CalculatorState = {
		input: {
			drugName: '',
			instructions: '',
			daysSupply: 30
		},
		isCalculating: false,
		result: null,
		error: null
	};

	const { subscribe, set, update } = writable<CalculatorState>(initialState);

	return {
		subscribe,

		setInput: (input: Partial<CalculatorState['input']>) => {
			update((state) => ({
				...state,
				input: { ...state.input, ...input }
			}));
		},

		setCalculating: (isCalculating: boolean) => {
			update((state) => ({ ...state, isCalculating }));
		},

		setResult: (result: CalculatorState['result']) => {
			update((state) => ({
				...state,
				result,
				isCalculating: false,
				error: null
			}));
		},

		setError: (error: string) => {
			update((state) => ({
				...state,
				error,
				isCalculating: false,
				result: null
			}));
		},

		reset: () => {
			set(initialState);
		},

		clearResult: () => {
			update((state) => ({
				...state,
				result: null,
				error: null
			}));
		}
	};
}

export const calculatorStore = createCalculatorStore();

// Derived stores
export const calculatorInput = derived(calculatorStore, ($store) => $store.input);

export const isCalculating = derived(calculatorStore, ($store) => $store.isCalculating);

export const calculationResult = derived(calculatorStore, ($store) => $store.result);

export const calculationError = derived(calculatorStore, ($store) => $store.error);

