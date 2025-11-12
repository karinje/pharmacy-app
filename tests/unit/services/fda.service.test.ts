import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fdaService } from '$lib/services/fda.service';
import { cacheService } from '$lib/services/cache.service';
import { fetchWithTimeout, retryWithBackoff, ApiError } from '$lib/utils/api-helpers';

// Mock dependencies
vi.mock('$lib/services/cache.service', () => ({
	cacheService: {
		get: vi.fn(),
		set: vi.fn(),
		clear: vi.fn()
	}
}));

vi.mock('$lib/utils/api-helpers', async () => {
	const actual = await vi.importActual('$lib/utils/api-helpers');
	return {
		...actual,
		fetchWithTimeout: vi.fn(),
		retryWithBackoff: vi.fn((fn) => fn())
	};
});

// Mock global fetch for RxNorm ingredient lookup
global.fetch = vi.fn();

describe('FDAService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(cacheService.get as any).mockReturnValue(null);
		(global.fetch as any).mockResolvedValue({
			ok: true,
			json: async () => ({ relatedGroup: { conceptGroup: [] } })
		});
	});

	describe('normalizeNDC', () => {
		it('should normalize 5-4-2 format NDC', () => {
			const result = fdaService.normalizeNDC('12345-6789-01');
			expect(result).toBe('12345678901');
		});

		it('should normalize 5-3-2 format NDC', () => {
			const result = fdaService.normalizeNDC('12345-678-90');
			expect(result).toBe('12345067890');
		});

		it('should normalize 4-4-2 format NDC', () => {
			const result = fdaService.normalizeNDC('1234-5678-90');
			expect(result).toBe('01234567890');
		});

		it('should handle already normalized NDC', () => {
			const result = fdaService.normalizeNDC('12345678901');
			expect(result).toBe('12345678901');
		});

		it('should handle NDC without hyphens', () => {
			const result = fdaService.normalizeNDC('123456789');
			expect(result).toBe('00123456789');
		});
	});

	describe('searchNDCsByDrugName', () => {
		it('should search NDCs successfully', async () => {
			const mockResponse = {
				results: [
					{
						product_ndc: '12345-678',
						generic_name: 'metformin',
						brand_name: 'Glucophage',
						labeler_name: 'Test Pharma',
						marketing_status: 'Prescription',
						dosage_form: 'TABLET',
						route: 'ORAL',
						active_ingredients: [{ name: 'metformin', strength: '500 MG' }],
						packaging: [
							{
								package_ndc: '12345-678-90',
								description: '100 TABLET in 1 BOTTLE'
							}
						]
					}
				]
			};

			(fetchWithTimeout as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await fdaService.searchNDCsByDrugName('metformin');

			expect(result).toHaveLength(1);
			expect(result[0].ndc).toBe('12345-678-90');
			expect(result[0].packageSize).toBe(100);
			expect(cacheService.set).toHaveBeenCalled();
		});

		it('should return cached results if available', async () => {
			const cachedResults = [
				{
					ndc: '12345-678-90',
					ndc11: '12345678901',
					genericName: 'metformin',
					packageSize: 100,
					packageUnit: 'TABLET',
					isActive: true
				}
			];

			(cacheService.get as any).mockReturnValueOnce(cachedResults);

			const result = await fdaService.searchNDCsByDrugName('metformin');

			expect(result).toEqual(cachedResults);
			expect(fetchWithTimeout).not.toHaveBeenCalled();
		});

		it('should throw error when all strategies fail', async () => {
			(fetchWithTimeout as any).mockResolvedValue({
				ok: false,
				status: 404
			});

			await expect(fdaService.searchNDCsByDrugName('nonexistent')).rejects.toThrow(
				ApiError
			);
		});
	});

	describe('validateNDC', () => {
		it('should validate NDC successfully', async () => {
			const mockResponse = {
				results: [
					{
						product_ndc: '12345-678',
						generic_name: 'metformin',
						packaging: [
							{
								package_ndc: '12345-678-90',
								description: '100 TABLET in 1 BOTTLE'
							}
						]
					}
				]
			};

			(fetchWithTimeout as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await fdaService.validateNDC('12345-678-90');

			expect(result).not.toBeNull();
			expect(result?.ndc).toBe('12345-678-90');
		});

		it('should return null for invalid NDC', async () => {
			(fetchWithTimeout as any).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ results: [] })
			});

			const result = await fdaService.validateNDC('invalid-ndc');

			expect(result).toBeNull();
		});
	});

	describe('filterActiveNDCs', () => {
		it('should filter active NDCs', () => {
			const products = [
				{ ndc: '1', isActive: true },
				{ ndc: '2', isActive: false },
				{ ndc: '3', isActive: true }
			] as any;

			const result = fdaService.filterActiveNDCs(products);

			expect(result).toHaveLength(2);
			expect(result.every((p) => p.isActive)).toBe(true);
		});
	});

	describe('filterInactiveNDCs', () => {
		it('should filter inactive NDCs', () => {
			const products = [
				{ ndc: '1', isActive: true },
				{ ndc: '2', isActive: false },
				{ ndc: '3', isActive: true }
			] as any;

			const result = fdaService.filterInactiveNDCs(products);

			expect(result).toHaveLength(1);
			expect(result.every((p) => !p.isActive)).toBe(true);
		});
	});
});

