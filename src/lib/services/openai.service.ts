import { env } from '$lib/config/env';
import { ApiError } from '$lib/utils/api-helpers';
import type {
	OpenAICalculationRequest,
	OpenAICalculationResponse,
	InstructionParsing,
	QuantityCalculation,
	PackageOptimization
} from '$lib/types/openai';
import {
	buildInstructionParserPrompt,
	buildPackageOptimizerPrompt,
	buildExplanationPrompt
} from '$lib/prompts';

class OpenAIService {
	private apiKey = env.openai.apiKey;
	private model = 'gpt-4o';
	private baseUrl = 'https://api.openai.com/v1/chat/completions';

	/**
	 * Call OpenAI API with retry logic
	 */
	private async callOpenAI(
		prompt: string,
		temperature: number = 0.1,
		maxRetries: number = 3
	): Promise<string> {
		let lastError: Error;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				const response = await fetch(this.baseUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.apiKey}`
					},
					body: JSON.stringify({
						model: this.model,
						messages: [
							{
								role: 'system',
								content:
									'You are a pharmaceutical calculation expert. Always return valid JSON when requested. Be precise and conservative in your calculations.'
							},
							{
								role: 'user',
								content: prompt
							}
						],
						temperature,
						max_tokens: 2000
					})
				});

				if (!response.ok) {
					const error = await response.json();
					throw new ApiError(
						error.error?.message || 'OpenAI API error',
						response.status,
						'OpenAI'
					);
				}

				const data = await response.json();
				return data.choices[0].message.content;
			} catch (error) {
				lastError = error as Error;

				// Don't retry on client errors
				if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
					throw error;
				}

				// Wait before retry (exponential backoff)
				if (attempt < maxRetries - 1) {
					await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
				}
			}
		}

		throw lastError!;
	}

	/**
	 * Parse JSON response from OpenAI
	 */
	private parseJSONResponse<T>(response: string): T {
		try {
			// Remove markdown code blocks if present
			const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

			return JSON.parse(cleaned);
		} catch (error) {
			throw new ApiError(
				'Failed to parse OpenAI response as JSON',
				500,
				'OpenAI',
				{ response, error }
			);
		}
	}

	/**
	 * Parse prescription instructions
	 */
	async parseInstructions(
		drugName: string,
		instructions: string,
		daysSupply: number
	): Promise<InstructionParsing> {
		const prompt = buildInstructionParserPrompt(drugName, instructions, daysSupply);
		const response = await this.callOpenAI(prompt, 0.1);
		return this.parseJSONResponse<InstructionParsing>(response);
	}

	/**
	 * Calculate total quantity needed
	 */
	async calculateQuantity(
		parsing: InstructionParsing,
		daysSupply: number
	): Promise<QuantityCalculation> {
		const prompt = `Given the following prescription parsing, calculate the total quantity needed.

PARSING: ${JSON.stringify(parsing, null, 2)}
DAYS SUPPLY: ${daysSupply} days

Calculate:
1. Daily quantity = dosage amount × frequency per day
2. Total quantity = daily quantity × days supply

If PRN (as needed), use maximum safe dosing.

Return JSON:
{
  "dailyQuantity": number,
  "totalQuantityNeeded": number,
  "calculation": "step-by-step explanation",
  "assumptions": ["list any assumptions made"],
  "uncertainties": ["list any uncertainties"]
}

DO NOT include any text before or after the JSON object.`;

		const response = await this.callOpenAI(prompt, 0.1);
		return this.parseJSONResponse<QuantityCalculation>(response);
	}

	/**
	 * Optimize package selection
	 */
	async optimizePackages(
		drugName: string,
		totalQuantityNeeded: number,
		availablePackages: OpenAICalculationRequest['availablePackages'],
		daysSupply: number
	): Promise<PackageOptimization> {
		const prompt = buildPackageOptimizerPrompt(
			drugName,
			totalQuantityNeeded,
			availablePackages.map((p) => ({
				ndc: p.ndc,
				size: p.packageSize,
				manufacturer: p.manufacturer,
				isActive: p.isActive
			})),
			daysSupply
		);

		const response = await this.callOpenAI(prompt, 0.2);
		return this.parseJSONResponse<PackageOptimization>(response);
	}

	/**
	 * Generate explanation
	 */
	async generateExplanation(
		drugName: string,
		instructions: string,
		daysSupply: number,
		parsing: InstructionParsing,
		quantity: QuantityCalculation,
		optimization: PackageOptimization
	): Promise<string> {
		const prompt = buildExplanationPrompt(drugName, instructions, daysSupply, parsing, quantity, optimization);

		return await this.callOpenAI(prompt, 0.3);
	}

	/**
	 * Complete calculation workflow
	 */
	async calculatePrescription(
		request: OpenAICalculationRequest
	): Promise<OpenAICalculationResponse> {
		// Step 1: Parse instructions
		const parsing = await this.parseInstructions(
			request.drugName,
			request.instructions,
			request.daysSupply
		);

		// Step 2: Calculate quantity
		const quantity = await this.calculateQuantity(parsing, request.daysSupply);

		// Step 3: Optimize packages
		const optimization = await this.optimizePackages(
			request.drugName,
			quantity.totalQuantityNeeded,
			request.availablePackages,
			request.daysSupply
		);

		// Step 4: Generate explanation
		const explanation = await this.generateExplanation(
			request.drugName,
			request.instructions,
			request.daysSupply,
			parsing,
			quantity,
			optimization
		);

		// Compile warnings
		const warnings: Array<{
			type: string;
			severity: 'high' | 'medium' | 'low';
			message: string;
		}> = [
			...parsing.warnings.map((w) => ({
				type: 'parsing',
				severity: 'medium' as const,
				message: w
			})),
			...quantity.uncertainties.map((u) => ({
				type: 'calculation',
				severity: 'low' as const,
				message: u
			}))
		];

		// Check for inactive NDCs
		const hasInactiveNDCs = request.availablePackages.some((p) => !p.isActive);
		if (hasInactiveNDCs) {
			warnings.push({
				type: 'inactive_ndc',
				severity: 'high' as const,
				message: 'Some NDC codes in the database are inactive and should not be used'
			});
		}

		// Determine overall confidence
		const overallConfidence = parsing.confidence;

		return {
			parsing,
			quantity,
			optimization,
			overallConfidence,
			warnings
		};
	}
}

export const openaiService = new OpenAIService();

