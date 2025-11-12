import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculationService } from '$lib/services/calculation.service';
import { rxnormService } from '$lib/services/rxnorm.service';
import { fdaService } from '$lib/services/fda.service';
import { openaiService } from '$lib/services/openai.service';

// Mock all services
vi.mock('$lib/services/rxnorm.service');
vi.mock('$lib/services/fda.service');
vi.mock('$lib/services/openai.service');

describe('Calculator Workflow Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should complete full calculation workflow', async () => {
		const input = {
			drugName: 'Metformin 500mg',
			instructions: 'Take 2 tablets twice daily',
			daysSupply: 90
		};

		// Mock RxNorm normalization
		const mockRxNormResult = {
			rxcui: '860975',
			name: 'Metformin 500 MG Oral Tablet',
			confidence: 'high' as const,
			originalInput: 'Metformin 500mg',
			alternatives: []
		};

		(vi.mocked(rxnormService.normalizeDrugName) as any).mockResolvedValue(mockRxNormResult);

		// Mock FDA products
		const mockFDAProducts = [
			{
				ndc: '12345-678-90',
				ndc11: '12345678901',
				genericName: 'metformin',
				brandName: 'Glucophage',
				manufacturer: 'Test Pharma',
				packageDescription: '100 TABLET in 1 BOTTLE',
				packageSize: 100,
				packageUnit: 'TABLET',
				isActive: true,
				marketingStatus: 'Prescription',
				dosageForm: 'TABLET',
				route: 'ORAL',
				strength: '500 MG'
			}
		];

		(vi.mocked(fdaService.searchNDCsByDrugName) as any).mockResolvedValue(mockFDAProducts);
		(vi.mocked(fdaService.filterActiveNDCs) as any).mockReturnValue(mockFDAProducts);
		(vi.mocked(fdaService.filterInactiveNDCs) as any).mockReturnValue([]);

		// Mock OpenAI calculation
		const mockOpenAIResult = {
			parsing: {
				dosage: { amount: 2, unit: 'tablet' },
				frequency: { timesPerDay: 2, interval: 'every 12 hours' },
				route: 'oral',
				confidence: 'high' as const,
				warnings: []
			},
			quantity: {
				dailyQuantity: 4,
				totalQuantityNeeded: 360, // 2 * 2 * 90
				calculation: '2 tablets × 2 times/day × 90 days = 360 tablets',
				assumptions: [],
				uncertainties: []
			},
			optimization: {
				recommendedPackages: [
					{
						ndc: '12345-678-90',
						quantity: 4,
						reason: '4 bottles needed for 360 tablets'
					}
				],
				alternatives: [
					{
						packages: [
							{
								ndc: '12345-678-90',
								quantity: 5
							}
						],
						rationale: 'Alternative with extra supply'
					}
				],
				rationale: 'Best match for quantity needed'
			},
			overallConfidence: 'high' as const,
			warnings: []
		};

		(vi.mocked(openaiService.calculatePrescription) as any).mockResolvedValue(mockOpenAIResult);
		(vi.mocked(openaiService.generateExplanation) as any).mockResolvedValue(
			'Test explanation for calculation'
		);

		const progressUpdates: any[] = [];

		const result = await calculationService.calculate(input, (progress) => {
			progressUpdates.push(progress);
		});

		// Verify progress updates
		expect(progressUpdates.length).toBeGreaterThan(0);
		expect(progressUpdates[0].stage).toBe('normalizing');
		expect(progressUpdates[progressUpdates.length - 1].stage).toBe('complete');

		// Verify result structure
		expect(result).toHaveProperty('id');
		expect(result).toHaveProperty('rxnormData');
		expect(result).toHaveProperty('quantity');
		expect(result).toHaveProperty('optimization');
		expect(result.quantity.totalQuantityNeeded).toBe(360);

		// Verify service calls
		expect(rxnormService.normalizeDrugName).toHaveBeenCalledWith('Metformin 500mg');
		expect(fdaService.searchNDCsByDrugName).toHaveBeenCalled();
		expect(openaiService.calculatePrescription).toHaveBeenCalled();
		expect(openaiService.generateExplanation).toHaveBeenCalled();
	}, 30000);

	it('should handle workflow with existing RxCUI', async () => {
		const input = {
			drugName: 'Metformin',
			rxcui: '860975',
			instructions: 'Take 1 tablet twice daily',
			daysSupply: 30
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

		(vi.mocked(fdaService.searchNDCsByDrugName) as any).mockResolvedValue(mockFDAProducts);
		(vi.mocked(fdaService.filterActiveNDCs) as any).mockReturnValue(mockFDAProducts);
		(vi.mocked(fdaService.filterInactiveNDCs) as any).mockReturnValue([]);
		(vi.mocked(openaiService.calculatePrescription) as any).mockResolvedValue(mockOpenAIResult);
		(vi.mocked(openaiService.generateExplanation) as any).mockResolvedValue('Test explanation');

		const result = await calculationService.calculate(input);

		expect(result.rxnormData.rxcui).toBe('860975');
		expect(rxnormService.normalizeDrugName).not.toHaveBeenCalled();
	});

	it('should handle errors gracefully', async () => {
		const input = {
			drugName: 'InvalidDrug',
			instructions: 'Take 1 tablet',
			daysSupply: 30
		};

		(vi.mocked(rxnormService.normalizeDrugName) as any).mockRejectedValue(
			new Error('Drug not found')
		);

		await expect(calculationService.calculate(input)).rejects.toThrow();
	});
});

