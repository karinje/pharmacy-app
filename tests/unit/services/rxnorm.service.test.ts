import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rxnormService } from '$lib/services/rxnorm.service';
import { cacheService } from '$lib/services/cache.service';
import { httpsCallable } from 'firebase/functions';
import { ApiError } from '$lib/utils/api-helpers';
import * as firebaseFunctions from 'firebase/functions';

// Mock Firebase Functions - mocks defined inside factory

vi.mock('firebase/functions', () => {
	const mockNormalize = vi.fn();
	const mockSearch = vi.fn();
	return {
		httpsCallable: vi.fn((functions: any, name: string) => {
			if (name === 'normalizeDrugName') return mockNormalize;
			if (name === 'searchDrugs') return mockSearch;
			return vi.fn();
		}),
		__mockNormalizeFn: mockNormalize,
		__mockSearchFn: mockSearch
	};
});

// Mock cache service
vi.mock('$lib/services/cache.service', () => ({
	cacheService: {
		get: vi.fn(),
		set: vi.fn(),
		clear: vi.fn()
	}
}));

describe('RxNormService', () => {
	const getMockNormalizeFn = () => (firebaseFunctions as any).__mockNormalizeFn;
	const getMockSearchFn = () => (firebaseFunctions as any).__mockSearchFn;

	beforeEach(() => {
		vi.clearAllMocks();
		getMockNormalizeFn().mockClear();
		getMockSearchFn().mockClear();
		(cacheService.get as any).mockReturnValue(null);
	});

	describe('normalizeDrugName', () => {
		it('should normalize drug name successfully', async () => {
			const mockResponse = {
				rxcui: '860975',
				name: 'Metformin 500 MG Oral Tablet',
				confidence: 'high' as const,
				alternatives: [
					{
						rxcui: '860975',
						name: 'Metformin 500 MG Oral Tablet',
						score: '100'
					}
				]
			};

			getMockNormalizeFn().mockResolvedValueOnce({
				data: mockResponse
			});

			const result = await rxnormService.normalizeDrugName('Metformin 500mg');

			expect(result).toMatchObject({
				rxcui: '860975',
				name: 'Metformin 500 MG Oral Tablet',
				confidence: 'high'
			});
			expect(result.originalInput).toBe('Metformin 500mg');
			expect(cacheService.set).toHaveBeenCalled();
		});

		it('should return cached result if available', async () => {
			const cachedResult = {
				rxcui: '860975',
				name: 'Metformin 500 MG Oral Tablet',
				confidence: 'high' as const,
				originalInput: 'Metformin',
				alternatives: []
			};

			(cacheService.get as any).mockReturnValueOnce(cachedResult);

			const result = await rxnormService.normalizeDrugName('Metformin');

			expect(result).toEqual(cachedResult);
			expect(getMockNormalizeFn()).not.toHaveBeenCalled();
		});

		it('should handle not-found error', async () => {
			const error: any = new Error('Not found');
			error.code = 'functions/not-found';
			getMockNormalizeFn().mockRejectedValueOnce(error);

			await expect(rxnormService.normalizeDrugName('InvalidDrug123')).rejects.toThrow(
				ApiError
			);
		});

		it('should handle unauthenticated error', async () => {
			const error: any = new Error('Unauthenticated');
			error.code = 'functions/unauthenticated';
			getMockNormalizeFn().mockRejectedValueOnce(error);

			await expect(rxnormService.normalizeDrugName('Metformin')).rejects.toThrow(ApiError);
		});
	});

	describe('searchDrugs', () => {
		it('should search drugs successfully', async () => {
			const mockResponse = {
				candidates: [
					{
						rxcui: '860975',
						name: 'Metformin 500 MG Oral Tablet',
						score: '100',
						rank: '1'
					}
				]
			};

			getMockSearchFn().mockResolvedValueOnce({
				data: mockResponse
			});

			const result = await rxnormService.searchDrugs('Metformin', 10);

			expect(result).toHaveLength(1);
			expect(result[0].rxcui).toBe('860975');
			expect(cacheService.set).toHaveBeenCalled();
		});

		it('should return empty array for short search terms', async () => {
			const result = await rxnormService.searchDrugs('M', 10);

			expect(result).toEqual([]);
			expect(getMockSearchFn()).not.toHaveBeenCalled();
		});

		it('should return cached results if available', async () => {
			const cachedResults = [
				{
					rxcui: '860975',
					name: 'Metformin 500 MG Oral Tablet',
					score: '100',
					rank: '1'
				}
			];

			(cacheService.get as any).mockReturnValueOnce(cachedResults);

			const result = await rxnormService.searchDrugs('Metformin', 10);

			expect(result).toEqual(cachedResults);
			expect(getMockSearchFn()).not.toHaveBeenCalled();
		});

		it('should return empty array on error', async () => {
			getMockSearchFn().mockRejectedValueOnce(new Error('API error'));

			const result = await rxnormService.searchDrugs('Metformin', 10);

			expect(result).toEqual([]);
		});
	});

	describe('clearCache', () => {
		it('should clear cache', () => {
			rxnormService.clearCache();
			expect(cacheService.clear).toHaveBeenCalled();
		});
	});
});

