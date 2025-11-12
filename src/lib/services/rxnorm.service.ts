import { functions } from '$lib/config/firebase';
import { httpsCallable } from 'firebase/functions';
import { CACHE_DURATION } from '$lib/config/constants';
import { cacheService } from './cache.service';
import { ApiError } from '$lib/utils/api-helpers';
import type { NormalizedDrug, RxNormCandidate } from '$lib/types/rxnorm';

interface NormalizeResponse {
	rxcui: string;
	name: string;
	confidence: 'high' | 'medium' | 'low';
	alternatives: Array<{
		rxcui: string;
		name: string;
		score: string;
	}>;
}

class RxNormService {
	private normalizeDrugNameFn = httpsCallable<{ drugName: string }, NormalizeResponse>(
		functions,
		'normalizeDrugName'
	);
	private searchDrugsFn = httpsCallable<
		{ term: string; maxResults?: number },
		{ candidates: RxNormCandidate[] }
	>(functions, 'searchDrugs');

	/**
	 * Normalize drug name to RxNorm concept
	 */
	async normalizeDrugName(drugName: string): Promise<NormalizedDrug> {
		const cacheKey = `rxnorm:normalize:${drugName.toLowerCase()}`;

		// Check cache first
		const cached = cacheService.get<NormalizedDrug>(cacheKey);
		if (cached) return cached;

		try {
			const result = await this.normalizeDrugNameFn({ drugName });
			const data = result.data;
			
			// Add originalInput to match NormalizedDrug interface
			const normalized: NormalizedDrug = {
				...data,
				originalInput: drugName,
				alternatives: data.alternatives.map((alt) => ({
					rxcui: alt.rxcui,
					name: alt.name,
					score: alt.score,
					rank: '0' // Cloud Function doesn't return rank
				}))
			};

			// Cache for 7 days
			cacheService.set(cacheKey, normalized, CACHE_DURATION.RXNORM);

			return normalized;
		} catch (error: any) {
			if (error.code === 'functions/not-found') {
				throw new ApiError('No matching drug found', 404, 'RxNorm');
			}
			if (error.code === 'functions/unauthenticated') {
				throw new ApiError('Authentication required', 401, 'RxNorm');
			}
			throw new ApiError(
				error.message || 'Failed to normalize drug name',
				500,
				'RxNorm',
				error
			);
		}
	}


	/**
	 * Search drugs by name (for autocomplete)
	 */
	async searchDrugs(term: string, maxResults: number = 10): Promise<RxNormCandidate[]> {
		if (term.length < 2) return [];

		const cacheKey = `rxnorm:search:${term.toLowerCase()}:${maxResults}`;

		const cached = cacheService.get<RxNormCandidate[]>(cacheKey);
		if (cached) {
			console.log('RxNorm search cache hit:', term);
			return cached;
		}

		try {
			console.log('RxNorm search calling function:', term);
			const startTime = Date.now();
			const result = await this.searchDrugsFn({ term, maxResults });
			const duration = Date.now() - startTime;
			const source = (result.data as any).source || 'unknown';
			console.log(`RxNorm search completed in ${duration}ms (source: ${source}):`, result.data);
			
			const candidates = result.data.candidates || [];
			console.log(`RxNorm candidates: ${candidates.length} from ${source}`);

			// Cache for 1 hour
			cacheService.set(cacheKey, candidates, 60 * 60 * 1000);

			return candidates;
		} catch (error: any) {
			console.error('RxNorm search failed:', {
				term,
				error,
				code: error?.code,
				message: error?.message,
				details: error?.details
			});
			return [];
		}
	}

	/**
	 * Clear RxNorm cache
	 */
	clearCache(): void {
		cacheService.clear();
	}
}

export const rxnormService = new RxNormService();

