import { writable, derived } from 'svelte/store';
import type { SavedCalculation } from '$lib/services/history.service';

interface HistoryState {
	calculations: SavedCalculation[];
	loading: boolean;
	error: string | null;
	searchQuery: string;
	favoritesOnly: boolean;
}

function createHistoryStore() {
	const initialState: HistoryState = {
		calculations: [],
		loading: false,
		error: null,
		searchQuery: '',
		favoritesOnly: false
	};

	const { subscribe, set, update } = writable<HistoryState>(initialState);

	return {
		subscribe,

		setCalculations: (calculations: SavedCalculation[]) => {
			update((state) => ({ ...state, calculations, loading: false, error: null }));
		},

		setLoading: (loading: boolean) => {
			update((state) => ({ ...state, loading }));
		},

		setError: (error: string) => {
			update((state) => ({ ...state, error, loading: false }));
		},

		setSearchQuery: (searchQuery: string) => {
			update((state) => ({ ...state, searchQuery }));
		},

		toggleFavoritesFilter: () => {
			update((state) => ({ ...state, favoritesOnly: !state.favoritesOnly }));
		},

		updateCalculation: (id: string, updates: Partial<SavedCalculation>) => {
			update((state) => ({
				...state,
				calculations: state.calculations.map((calc) =>
					calc.id === id ? { ...calc, ...updates } : calc
				)
			}));
		},

		removeCalculation: (id: string) => {
			update((state) => ({
				...state,
				calculations: state.calculations.filter((calc) => calc.id !== id)
			}));
		},

		reset: () => {
			set(initialState);
		}
	};
}

export const historyStore = createHistoryStore();

// Derived stores
export const filteredHistory = derived(historyStore, ($store) => {
	let filtered = $store.calculations;

	if ($store.favoritesOnly) {
		filtered = filtered.filter((calc) => calc.isFavorite);
	}

	if ($store.searchQuery) {
		const query = $store.searchQuery.toLowerCase();
		filtered = filtered.filter(
			(calc) =>
				calc.calculation.input.drugName.toLowerCase().includes(query) ||
				calc.calculation.input.instructions.toLowerCase().includes(query) ||
				calc.notes?.toLowerCase().includes(query)
		);
	}

	return filtered;
});

export const isLoading = derived(historyStore, ($store) => $store.loading);
export const historyError = derived(historyStore, ($store) => $store.error);

