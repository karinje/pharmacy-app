import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculationService } from '$lib/services/calculation.service';
import { rxnormService } from '$lib/services/rxnorm.service';
import { fdaService } from '$lib/services/fda.service';
import { openaiService } from '$lib/services/openai.service';
import { ApiError } from '$lib/utils/api-helpers';

// Mock services
vi.mock('$lib/services/rxnorm.service');
vi.mock('$lib/services/fda.service');
vi.mock('$lib/services/openai.service');

describe('CalculationService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('calculate', () => {
		it('should complete full calculation workflow', async () => {
			const mockRxNormResult = {
				rxcui: '860975',
				name: 'Metformin 500 MG Oral Tablet',
				confidence: 'high' as const,
				originalInput: 'Metformin',
				alternatives: []
			};

			const mockFDAProducts = [
				{
					ndc: '12345-678-90',
					ndc11: '12345678901',
					genericName: 'metformin',
					packageSize: 100,
					packageUnit: 'TABLET',
					isActive: true
				}
			];

			const mockOpenAIResult = {
				parsing: {
					dosage: { amount: 1, unit: 'tablet' },
					frequency: { timesPerDay: 2 },
					route: 'oral',
					confidence: 'high' as const,
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
					recommendedPackages: [
						{
							ndc: '12345-678-90',
							quantity: 1,
							reason: 'Best match'
						}
					],
					alternatives: [],
					rationale: 'Test rationale'
				},
				overallConfidence: 'high' as const,
				warnings: []
			};

			(vi.mocked(rxnormService.normalizeDrugName) as any).mockResolvedValue(
				mockRxNormResult
			);
			(vi.mocked(fdaService.searchNDCsByDrugName) as any).mockResolvedValue(
				mockFDAProducts
			);
			(vi.mocked(fdaService.filterActiveNDCs) as any).mockReturnValue(mockFDAProducts);
			(vi.mocked(fdaService.filterInactiveNDCs) as any).mockReturnValue([]);
			(vi.mocked(openaiService.calculatePrescription) as any).mockResolvedValue(
				mockOpenAIResult
			);
			(vi.mocked(openaiService.generateExplanation) as any).mockResolvedValue(
				'Test explanation'
			);

			const input = {
				drugName: 'Metformin',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30
			};

			const progressUpdates: any[] = [];
			const result = await calculationService.calculate(input, (progress) => {
				progressUpdates.push(progress);
			});

			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('rxnormData');
			expect(result).toHaveProperty('quantity');
			expect(result.quantity.totalQuantityNeeded).toBe(60);
			expect(progressUpdates.length).toBeGreaterThan(0);
			expect(progressUpdates[0].stage).toBe('normalizing');
		});

		it('should use existing RxCUI when provided', async () => {
			const mockFDAProducts = [
				{
					ndc: '12345-678-90',
					ndc11: '12345678901',
					genericName: 'metformin',
					packageSize: 100,
					packageUnit: 'TABLET',
					isActive: true
				}
			];

			const mockOpenAIResult = {
				parsing: {
					dosage: { amount: 1, unit: 'tablet' },
					frequency: { timesPerDay: 2 },
					route: 'oral',
					confidence: 'high' as const,
					warnings: []
				},
				quantity: {
					dailyQuantity: 2,
					totalQuantityNeeded: 60,
					calculation: 'Test',
					assumptions: [],
					uncertainties: []
				},
				optimization: {
					recommendedPackages: [],
					alternatives: [],
					rationale: 'Test'
				},
				overallConfidence: 'high' as const,
				warnings: []
			};

			(vi.mocked(fdaService.searchNDCsByDrugName) as any).mockResolvedValue(
				mockFDAProducts
			);
			(vi.mocked(fdaService.filterActiveNDCs) as any).mockReturnValue(mockFDAProducts);
			(vi.mocked(fdaService.filterInactiveNDCs) as any).mockReturnValue([]);
			(vi.mocked(openaiService.calculatePrescription) as any).mockResolvedValue(
				mockOpenAIResult
			);
			(vi.mocked(openaiService.generateExplanation) as any).mockResolvedValue(
				'Test explanation'
			);

			const input = {
				drugName: 'Metformin',
				rxcui: '860975',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30
			};

			await calculationService.calculate(input);

			expect(rxnormService.normalizeDrugName).not.toHaveBeenCalled();
		});

		it('should throw error when no NDC products found', async () => {
			(vi.mocked(rxnormService.normalizeDrugName) as any).mockResolvedValue({
				rxcui: '860975',
				name: 'Metformin',
				confidence: 'high' as const,
				originalInput: 'Metformin',
				alternatives: []
			});
			(vi.mocked(fdaService.searchNDCsByDrugName) as any).mockResolvedValue([]);

			const input = {
				drugName: 'Metformin',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30
			};

			await expect(calculationService.calculate(input)).rejects.toThrow(ApiError);
		});

		it('should warn when no active products available', async () => {
			const mockRxNormResult = {
				rxcui: '860975',
				name: 'Metformin',
				confidence: 'high' as const,
				originalInput: 'Metformin',
				alternatives: []
			};

			const mockFDAProducts = [
				{
					ndc: '12345-678-90',
					ndc11: '12345678901',
					genericName: 'metformin',
					packageSize: 100,
					packageUnit: 'TABLET',
					isActive: false
				}
			];

			const mockOpenAIResult = {
				parsing: {
					dosage: { amount: 1, unit: 'tablet' },
					frequency: { timesPerDay: 2 },
					route: 'oral',
					confidence: 'high' as const,
					warnings: []
				},
				quantity: {
					dailyQuantity: 2,
					totalQuantityNeeded: 60,
					calculation: 'Test',
					assumptions: [],
					uncertainties: []
				},
				optimization: {
					recommendedPackages: [],
					alternatives: [],
					rationale: 'Test'
				},
				overallConfidence: 'high' as const,
				warnings: []
			};

			(vi.mocked(rxnormService.normalizeDrugName) as any).mockResolvedValue(
				mockRxNormResult
			);
			(vi.mocked(fdaService.searchNDCsByDrugName) as any).mockResolvedValue(
				mockFDAProducts
			);
			(vi.mocked(fdaService.filterActiveNDCs) as any).mockReturnValue([]);
			(vi.mocked(fdaService.filterInactiveNDCs) as any).mockReturnValue(mockFDAProducts);
			(vi.mocked(openaiService.calculatePrescription) as any).mockResolvedValue(
				mockOpenAIResult
			);
			(vi.mocked(openaiService.generateExplanation) as any).mockResolvedValue(
				'Test explanation'
			);

			const input = {
				drugName: 'Metformin',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30
			};

			const result = await calculationService.calculate(input);

			expect(result.warnings.some((w) => w.type === 'fda' && w.severity === 'high')).toBe(
				true
			);
		});
	});

	describe('validateInput', () => {
		it('should validate correct input', () => {
			const input = {
				drugName: 'Metformin 500mg',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30
			};

			const result = calculationService.validateInput(input);

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject short drug name', () => {
			const input = {
				drugName: 'M',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30
			};

			const result = calculationService.validateInput(input);

			expect(result.isValid).toBe(false);
			expect(result.errors).toContain('Drug name must be at least 2 characters');
		});

		it('should reject invalid days supply', () => {
			const input = {
				drugName: 'Metformin',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 0
			};

			const result = calculationService.validateInput(input);

			expect(result.isValid).toBe(false);
			expect(result.errors.some((e) => e.includes('Days supply'))).toBe(true);
		});
	});
});

