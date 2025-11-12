import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openaiService } from '$lib/services/openai.service';
import { ApiError } from '$lib/utils/api-helpers';

// Mock environment
vi.mock('$lib/config/env', () => ({
	env: {
		openai: {
			apiKey: 'test-api-key'
		}
	}
}));

// Mock prompts
vi.mock('$lib/prompts', () => ({
	buildInstructionParserPrompt: vi.fn(() => 'test prompt'),
	buildPackageOptimizerPrompt: vi.fn(() => 'test prompt'),
	buildExplanationPrompt: vi.fn(() => 'test prompt')
}));

// Mock global fetch
global.fetch = vi.fn();

describe('OpenAIService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('parseInstructions', () => {
		it('should parse instructions successfully', async () => {
			const mockResponse = {
				choices: [
					{
						message: {
							content: JSON.stringify({
								dosage: { amount: 1, unit: 'tablet' },
								frequency: { timesPerDay: 2 },
								route: 'oral',
								confidence: 'high',
								warnings: []
							})
						}
					}
				]
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await openaiService.parseInstructions(
				'Metformin',
				'Take 1 tablet twice daily',
				30
			);

			expect(result).toHaveProperty('dosage');
			expect(result).toHaveProperty('frequency');
			expect(result.confidence).toBe('high');
		});

		it('should handle JSON parse error', async () => {
			const mockResponse = {
				choices: [
					{
						message: {
							content: 'Invalid JSON response'
						}
					}
				]
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			await expect(
				openaiService.parseInstructions('Metformin', 'Take 1 tablet', 30)
			).rejects.toThrow(ApiError);
		});

		it('should handle API errors', async () => {
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({ error: { message: 'Invalid API key' } })
			});

			await expect(
				openaiService.parseInstructions('Metformin', 'Take 1 tablet', 30)
			).rejects.toThrow(ApiError);
		});
	});

	describe('calculateQuantity', () => {
		it('should calculate quantity successfully', async () => {
			const mockResponse = {
				output_text: JSON.stringify({
					dailyQuantity: 2,
					totalQuantityNeeded: 60,
					calculation: '1 tablet × 2 times/day × 30 days = 60 tablets',
					assumptions: [],
					uncertainties: []
				})
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const parsing = {
				dosage: { amount: 1, unit: 'tablet' },
				frequency: { timesPerDay: 2 },
				route: 'oral',
				confidence: 'high' as const,
				warnings: []
			};

			const result = await openaiService.calculateQuantity(parsing, 30);

			expect(result.totalQuantityNeeded).toBe(60);
			expect(result.dailyQuantity).toBe(2);
		});
	});

	describe('optimizePackages', () => {
		it('should optimize packages successfully', async () => {
			const mockResponse = {
				choices: [
					{
						message: {
							content: JSON.stringify({
								recommendedPackages: [
									{
										ndc: '12345-678-90',
										quantity: 1,
										reason: 'Best match'
									}
								],
								alternatives: [],
								rationale: 'Test rationale'
							})
						}
					}
				]
			};

			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			});

			const result = await openaiService.optimizePackages(
				'Metformin',
				60,
				[
					{
						ndc: '12345-678-90',
						ndc11: '12345678901',
						genericName: 'metformin',
						packageSize: 100,
						packageUnit: 'TABLET',
						isActive: true
					}
				],
				30
			);

			expect(result.recommendedPackages).toHaveLength(1);
		});
	});

	describe('calculatePrescription', () => {
		it('should complete full calculation workflow', async () => {
			// Mock parseInstructions
			(global.fetch as any)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						choices: [
							{
								message: {
									content: JSON.stringify({
										dosage: { amount: 1, unit: 'tablet' },
										frequency: { timesPerDay: 2 },
										route: 'oral',
										confidence: 'high',
										warnings: []
									})
								}
							}
						]
					})
				})
				// Mock calculateQuantity (GPT-5 Responses API)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						output_text: JSON.stringify({
							dailyQuantity: 2,
							totalQuantityNeeded: 60,
							calculation: 'Test calculation',
							assumptions: [],
							uncertainties: []
						})
					})
				})
				// Mock optimizePackages
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						choices: [
							{
								message: {
									content: JSON.stringify({
										recommendedPackages: [
											{
												ndc: '12345-678-90',
												quantity: 1,
												reason: 'Best match'
											}
										],
										alternatives: [],
										rationale: 'Test rationale'
									})
								}
							}
						]
					})
				})
				// Mock generateExplanation
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						choices: [
							{
								message: {
									content: 'Test explanation'
								}
							}
						]
					})
				});

			const request = {
				drugName: 'Metformin',
				rxcui: '860975',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30,
				availablePackages: [
					{
						ndc: '12345-678-90',
						ndc11: '12345678901',
						genericName: 'metformin',
						packageSize: 100,
						packageUnit: 'TABLET',
						isActive: true
					}
				]
			};

			const result = await openaiService.calculatePrescription(request);

			expect(result).toHaveProperty('parsing');
			expect(result).toHaveProperty('quantity');
			expect(result).toHaveProperty('optimization');
			expect(result.quantity.totalQuantityNeeded).toBe(60);
		});
	});
});

