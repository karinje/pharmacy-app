import { writable, derived } from 'svelte/store';
import type { CalculationResult, CalculationProgress } from '$lib/types/calculation';
import type { CalculatorFormData } from '$lib/types/calculator';

interface CalculatorState {
	result: CalculationResult | null;
	progress: CalculationProgress | null;
	isCalculating: boolean;
	error: string | null;
}

function createCalculatorStore() {
	const initialState: CalculatorState = {
		result: null,
		progress: null,
		isCalculating: false,
		error: null
	};

	const { subscribe, set, update } = writable<CalculatorState>(initialState);

	return {
		subscribe,

		setCalculating: (isCalculating: boolean) => {
			update((state) => ({ ...state, isCalculating, error: null }));
		},

		setProgress: (progress: CalculationProgress) => {
			update((state) => ({ ...state, progress }));
		},

		setResult: (result: CalculationResult) => {
			update((state) => ({
				...state,
				result,
				isCalculating: false,
				progress: null,
				error: null
			}));
		},

		setError: (error: string) => {
			update((state) => ({
				...state,
				error,
				isCalculating: false,
				progress: null,
				result: null
			}));
		},

		reset: () => {
			set(initialState);
		}
	};
}

export const calculatorStore = createCalculatorStore();

// Derived stores
export const calculationResult = derived(calculatorStore, ($store) => $store.result);
export const isCalculating = derived(calculatorStore, ($store) => $store.isCalculating);
export const calculationProgress = derived(calculatorStore, ($store) => $store.progress);
export const calculationError = derived(calculatorStore, ($store) => $store.error);

