import { rxnormService } from './rxnorm.service';
import { fdaService } from './fda.service';
import { openaiService } from './openai.service';
import type { CalculationInput, CalculationResult, CalculationProgress, Warning } from '$lib/types/calculation';
import { ApiError } from '$lib/utils/api-helpers';

class CalculationService {
	/**
	 * Main calculation workflow
	 */
	async calculate(
		input: CalculationInput,
		onProgress?: (progress: CalculationProgress) => void
	): Promise<CalculationResult> {
		const warnings: Warning[] = [];
		const startTime = Date.now();

		try {
			// Stage 1: Normalize drug name with RxNorm
			onProgress?.({
				stage: 'normalizing',
				message: 'Looking up drug in RxNorm database...',
				progress: 10
			});

			const normalized = await rxnormService.normalizeDrugName(input.drugName);

			if (normalized.confidence === 'low') {
				warnings.push({
					type: 'rxnorm',
					severity: 'medium',
					message: `Low confidence match for "${input.drugName}". Using: ${normalized.name}`,
					details: { alternatives: normalized.alternatives }
				});
			}

			// Stage 2: Fetch NDC products from FDA
			onProgress?.({
				stage: 'fetching_ndcs',
				message: 'Fetching available NDC products...',
				progress: 30
			});

			const allProducts = await fdaService.searchNDCsByDrugName(normalized.name);

			if (allProducts.length === 0) {
				throw new ApiError('No NDC products found for this drug', 404, 'FDA');
			}

			const activeProducts = fdaService.filterActiveNDCs(allProducts);
			const inactiveProducts = fdaService.filterInactiveNDCs(allProducts);

			if (activeProducts.length === 0) {
				warnings.push({
					type: 'fda',
					severity: 'high',
					message: 'No active NDC products available. All products are inactive.',
					details: { inactiveCount: inactiveProducts.length }
				});
			}

			if (inactiveProducts.length > 0) {
				warnings.push({
					type: 'inactive_ndc',
					severity: 'medium',
					message: `${inactiveProducts.length} inactive NDC(s) found in database`,
					details: { inactive: inactiveProducts.map((p) => p.ndc) }
				});
			}

			// Stage 3: Calculate with OpenAI
			onProgress?.({
				stage: 'calculating',
				message: 'Analyzing prescription instructions...',
				progress: 50
			});

			const openaiRequest = {
				drugName: normalized.name,
				rxcui: normalized.rxcui,
				instructions: input.instructions,
				daysSupply: input.daysSupply,
				availablePackages: allProducts.map((p) => ({
					ndc: p.ndc,
					ndc11: p.ndc11,
					genericName: p.genericName,
					brandName: p.brandName,
					manufacturer: p.manufacturer,
					packageSize: p.packageSize,
					packageUnit: p.packageUnit,
					isActive: p.isActive,
					marketingStatus: p.marketingStatus,
					dosageForm: p.dosageForm,
					strength: p.strength
				}))
			};

			const openaiResult = await openaiService.calculatePrescription(openaiRequest);

			// Stage 4: Compile results
			onProgress?.({
				stage: 'optimizing',
				message: 'Optimizing package selection...',
				progress: 80
			});

			// Merge warnings
			warnings.push(
				...openaiResult.warnings.map((w) => ({
					type: w.type as Warning['type'],
					severity: w.severity,
					message: w.message,
					details: undefined
				}))
			);

			// Generate explanation
			const explanation = await openaiService.generateExplanation(
				normalized.name,
				input.instructions,
				input.daysSupply,
				openaiResult.parsing,
				openaiResult.quantity,
				openaiResult.optimization
			);

			// Generate unique ID
			const id = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const result: CalculationResult = {
				id,
				input,
				rxnormData: {
					rxcui: normalized.rxcui,
					name: normalized.name,
					confidence: normalized.confidence
				},
				allProducts,
				activeProducts,
				inactiveProducts,
				parsing: openaiResult.parsing,
				quantity: openaiResult.quantity,
				optimization: openaiResult.optimization,
				explanation,
				warnings: this.sortWarnings(warnings),
				timestamp: new Date()
			};

			onProgress?.({
				stage: 'complete',
				message: 'Calculation complete!',
				progress: 100
			});

			const duration = Date.now() - startTime;
			console.log(`Calculation completed in ${duration}ms`);

			return result;
		} catch (error) {
			onProgress?.({
				stage: 'error',
				message: error instanceof Error ? error.message : 'Calculation failed',
				progress: 0
			});

			throw error;
		}
	}

	/**
	 * Sort warnings by severity
	 */
	private sortWarnings(warnings: Warning[]): Warning[] {
		const severityOrder = { high: 0, medium: 1, low: 2 };
		return warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
	}

	/**
	 * Validate calculation input
	 */
	validateInput(input: CalculationInput): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		if (!input.drugName || input.drugName.trim().length < 2) {
			errors.push('Drug name must be at least 2 characters');
		}

		if (!input.instructions || input.instructions.trim().length < 5) {
			errors.push('Instructions must be at least 5 characters');
		}

		if (!input.daysSupply || input.daysSupply < 1 || input.daysSupply > 365) {
			errors.push('Days supply must be between 1 and 365');
		}

		return {
			isValid: errors.length === 0,
			errors
		};
	}
}

export const calculationService = new CalculationService();

