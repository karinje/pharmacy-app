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
	private reasoningModel = 'gpt-5'; // GPT-5 with embedded reasoning for math calculations
	private baseUrl = 'https://api.openai.com/v1/chat/completions';
	private responsesApiUrl = 'https://api.openai.com/v1/responses'; // GPT-5 uses Responses API

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
			if (!response || !response.trim()) {
				throw new Error('Empty response from OpenAI');
			}
			
			console.log('Parsing JSON response, length:', response.length);
			console.log('Response preview:', response.substring(0, 200));
			
			// Remove markdown code blocks if present
			const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

			const parsed = JSON.parse(cleaned);
			console.log('Successfully parsed JSON');
			return parsed;
		} catch (error) {
			console.error('JSON parse error:', error);
			console.error('Response that failed to parse:', response);
			throw new ApiError(
				'Failed to parse OpenAI response as JSON',
				500,
				'OpenAI',
				{ response, error: error instanceof Error ? error.message : String(error) }
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
	 * Uses reasoning model (o1-mini) with low reasoning effort for accurate math
	 * Handles complex cases like insulin vials, liquid medications, etc.
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

Special considerations:
- For insulin vials: Calculate units needed, then determine vials (typically 1000 units/vial)
- For liquid medications: Consider concentration and volume
- For PRN (as needed): Use maximum safe dosing frequency
- For complex dosing: Break down step by step

Return JSON:
{
  "dailyQuantity": number,
  "totalQuantityNeeded": number,
  "calculation": "step-by-step explanation showing your work",
  "assumptions": [],
  "uncertainties": []
}

IMPORTANT: Leave assumptions and uncertainties as empty arrays []. Do not populate them.

DO NOT include any text before or after the JSON object.`;

		// Use reasoning model for math calculations (better accuracy)
		const response = await this.callOpenAIWithReasoning(prompt, 'low');
		return this.parseJSONResponse<QuantityCalculation>(response);
	}

	/**
	 * Call OpenAI GPT-5 using Responses API with reasoning effort
	 * GPT-5 requires Responses API, not Chat Completions
	 */
	private async callOpenAIWithReasoning(
		prompt: string,
		reasoningEffort: 'minimal' | 'low' | 'medium' | 'high' = 'low',
		maxRetries: number = 3
	): Promise<string> {
		let lastError: Error;

		for (let attempt = 0; attempt < maxRetries; attempt++) {
			try {
				// GPT-5 uses Responses API with different format
				const requestBody = {
					model: this.reasoningModel,
					input: `You are a pharmaceutical calculation expert. Always return valid JSON when requested. Show your mathematical work step by step.\n\n${prompt}`,
					reasoning: {
						effort: reasoningEffort
					},
					max_output_tokens: 4000
				};

				const response = await fetch(this.responsesApiUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.apiKey}`
					},
					body: JSON.stringify(requestBody)
				});

				if (!response.ok) {
					const error = await response.json();
					console.error('OpenAI GPT-5 Responses API error:', {
						status: response.status,
						error: error,
						model: this.reasoningModel
					});
					throw new ApiError(
						error.error?.message || 'OpenAI API error',
						response.status,
						'OpenAI',
						error
					);
				}

				const data = await response.json();
				console.log('GPT-5 Responses API response:', JSON.stringify(data, null, 2));
				
				// GPT-5 Responses API structure:
				// output is an array where:
				// - output[0] is reasoning (type: "reasoning")
				// - output[1] is the message (type: "message") with content array
				// - content[0] has type: "output_text" and contains the text
				let outputText = '';
				
				if (data.output_text) {
					// Direct output_text (if available)
					outputText = data.output_text;
				} else if (Array.isArray(data.output)) {
					// Find the message output (skip reasoning)
					const messageOutput = data.output.find((item: any) => item.type === 'message');
					if (messageOutput && Array.isArray(messageOutput.content)) {
						// Find the output_text content item
						const textContent = messageOutput.content.find((item: any) => item.type === 'output_text');
						if (textContent && textContent.text) {
							outputText = textContent.text;
						}
					}
				}
				
				console.log('Extracted output text:', outputText);
				
				if (!outputText) {
					throw new ApiError(
						'GPT-5 response did not contain output text',
						500,
						'OpenAI',
						{ response: data }
					);
				}
				
				return outputText;
			} catch (error) {
				lastError = error as Error;

				// Log error details
				if (error instanceof ApiError) {
					console.error('OpenAI GPT-5 API call failed:', {
						status: error.status,
						message: error.message,
						model: this.reasoningModel,
						attempt: attempt + 1
					});
				}

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

		// Compile warnings (filter out empty/null warnings)
		const warnings: Array<{
			type: string;
			severity: 'high' | 'medium' | 'low';
			message: string;
		}> = [
			...parsing.warnings
				.filter((w) => w && w.trim() && w.toLowerCase() !== 'none')
				.map((w) => ({
					type: 'parsing',
					severity: 'medium' as const,
					message: w
				})),
			// Don't convert uncertainties to warnings - they're just noise
			// If GPT-5 generates them anyway, ignore them completely
		];

		// Don't add duplicate inactive NDC warning here - handled in calculation service

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

