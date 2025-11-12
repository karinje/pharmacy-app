import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

// Initialize Firebase Admin (only once)
if (admin.apps.length === 0) {
	admin.initializeApp();
}

// Lazy initialization of OpenAI client (only when function is called)
function getOpenAIClient(): OpenAI {
	const apiKey = functions.config().openai?.key || process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error('OpenAI API key not configured. Set functions.config().openai.key or OPENAI_API_KEY environment variable.');
	}
	return new OpenAI({ apiKey });
}

interface CalculateRequest {
	drugName: string;
	rxcui: string;
	instructions: string;
	daysSupply: number;
	availablePackages: Array<{
		ndc: string;
		ndc11: string;
		genericName: string;
		brandName?: string;
		manufacturer: string;
		packageSize: number;
		packageUnit: string;
		isActive: boolean;
		marketingStatus: string;
		dosageForm: string;
		strength: string;
	}>;
}

function buildInstructionParserPrompt(drugName: string, instructions: string, daysSupply: number): string {
	return `You are a pharmaceutical expert analyzing prescription instructions to calculate medication quantities.

DRUG: ${drugName}
INSTRUCTIONS: ${instructions}
DAYS SUPPLY: ${daysSupply} days

Your task is to parse the instructions and extract:
1. Dosage amount (e.g., "2 tablets", "10 mL", "20 units")
2. Frequency (e.g., "twice daily", "every 6 hours", "as needed")
3. Frequency per day (numeric value)
4. Special instructions
5. Whether this is PRN (as needed)

Common medical abbreviations:
- QD/OD = once daily (1x/day)
- BID = twice daily (2x/day)
- TID = three times daily (3x/day)
- QID = four times daily (4x/day)
- Q4H = every 4 hours (6x/day)
- Q6H = every 6 hours (4x/day)
- Q8H = every 8 hours (3x/day)
- Q12H = every 12 hours (2x/day)
- PRN = as needed
- AC = before meals
- PC = after meals
- HS = at bedtime

Return a JSON object with this EXACT structure:
{
  "dosageAmount": number,
  "dosageUnit": "tablet" | "capsule" | "mL" | "unit" | "puff" | "other",
  "frequency": "description of frequency",
  "frequencyPerDay": number,
  "specialInstructions": "any special notes or warnings",
  "isPRN": boolean,
  "confidence": "high" | "medium" | "low",
  "reasoning": "explain your interpretation",
  "warnings": ["list any ambiguities or concerns"]
}

IMPORTANT:
- Be conservative with PRN dosing - assume maximum safe usage
- Flag any unclear or ambiguous instructions
- Consider the days supply when evaluating reasonableness
- DO NOT include any text before or after the JSON object`;
}

function buildPackageOptimizerPrompt(
	drugName: string,
	totalQuantityNeeded: number,
	availablePackages: Array<{
		ndc: string;
		size: number;
		manufacturer: string;
		isActive: boolean;
	}>,
	daysSupply: number
): string {
	const activePackages = availablePackages.filter((p) => p.isActive);
	const inactivePackages = availablePackages.filter((p) => !p.isActive);

	return `You are a pharmacy optimization expert. Your task is to recommend the best NDC package combinations for dispensing medication.

DRUG: ${drugName}
TOTAL QUANTITY NEEDED: ${totalQuantityNeeded} units
DAYS SUPPLY: ${daysSupply} days

AVAILABLE ACTIVE PACKAGES:
${activePackages.map((p) => `- NDC ${p.ndc}: ${p.size} units (${p.manufacturer})`).join('\n')}

${inactivePackages.length > 0 ? `INACTIVE PACKAGES (DO NOT RECOMMEND):
${inactivePackages.map((p) => `- NDC ${p.ndc}: ${p.size} units (${p.manufacturer}) [INACTIVE]`).join('\n')}` : ''}

Optimization goals (in priority order):
1. **Patient convenience**: Fewer bottles is better
2. **Waste minimization**: Minimize excess units (but must meet or exceed quantity needed)
3. **Active NDCs only**: NEVER recommend inactive NDCs

Provide 3 package recommendations ranked by overall value:
- Rank 1: Best balance of convenience and minimal waste
- Rank 2: Alternative with different trade-offs
- Rank 3: Another viable option

For each recommendation, calculate:
- Number of each package size needed
- Total units dispensed
- Waste units (total - needed)
- Waste percentage

Return a JSON object with this EXACT structure:
{
  "recommendedPackages": [
    {
      "ndc": "string",
      "quantity": number,
      "totalUnits": number,
      "wasteUnits": number,
      "wastePercentage": number,
      "rank": 1 | 2 | 3
    }
  ],
  "reasoning": "explain your ranking logic and trade-offs",
  "alternatives": [
    {
      "description": "brief description",
      "packages": [{"ndc": "string", "quantity": number}],
      "pros": ["list advantages"],
      "cons": ["list disadvantages"]
    }
  ]
}

CRITICAL RULES:
- ONLY use active NDCs in recommendations
- Total units must be >= quantity needed
- Minimize number of bottles when possible
- Explain waste trade-offs clearly
- DO NOT include any text before or after the JSON object`;
}

function buildExplanationPrompt(
	drugName: string,
	instructions: string,
	daysSupply: number,
	parsing: any,
	quantity: any,
	optimization: any
): string {
	return `Generate a clear, concise explanation for a pharmacist about this NDC calculation.

CONTEXT:
- Drug: ${drugName}
- Instructions: ${instructions}
- Days Supply: ${daysSupply}

PARSING: ${JSON.stringify(parsing, null, 2)}
QUANTITY: ${JSON.stringify(quantity, null, 2)}
OPTIMIZATION: ${JSON.stringify(optimization, null, 2)}

Create a professional explanation that:
1. Summarizes the interpretation of instructions
2. Shows the quantity calculation
3. Explains the recommended package(s)
4. Notes any warnings or uncertainties

Keep it under 150 words and use pharmacist-friendly language.
Return ONLY the explanation text, no JSON.`;
}

function parseJSONResponse<T>(response: string): T {
	try {
		// Remove markdown code blocks if present
		const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		return JSON.parse(cleaned) as T;
	} catch (error) {
		throw new functions.https.HttpsError(
			'internal',
			'Failed to parse OpenAI response as JSON',
			{ response, error }
		);
	}
}

/**
 * Main calculation Cloud Function
 * Orchestrates RxNorm, FDA, and OpenAI services
 */
export const calculatePrescription = functions
	.region('us-central1')
	.runWith({
		timeoutSeconds: 60,
		memory: '512MB'
	})
	.https.onCall(async (data: CalculateRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
		}

		try {
			// Step 1: Parse instructions with OpenAI
			const parsingPrompt = buildInstructionParserPrompt(
				data.drugName,
				data.instructions,
				data.daysSupply
			);

			const openai = getOpenAIClient();
			const parsingCompletion = await openai.chat.completions.create({
				model: 'gpt-4o',
				messages: [
					{
						role: 'system',
						content: 'You are a pharmaceutical calculation expert. Always return valid JSON.'
					},
					{
						role: 'user',
						content: parsingPrompt
					}
				],
				temperature: 0.1,
				max_tokens: 1000
			});

			const parsing = parseJSONResponse<{
				dosageAmount: number;
				dosageUnit: string;
				frequency: string;
				frequencyPerDay: number;
				specialInstructions?: string;
				isPRN: boolean;
				confidence: 'high' | 'medium' | 'low';
				reasoning: string;
				warnings: string[];
			}>(parsingCompletion.choices[0].message.content || '{}');

			// Step 2: Calculate quantity
			const dailyQuantity = parsing.dosageAmount * parsing.frequencyPerDay;
			const totalQuantityNeeded = dailyQuantity * data.daysSupply;

			const quantity = {
				dailyQuantity,
				totalQuantityNeeded,
				calculation: `${parsing.dosageAmount} ${parsing.dosageUnit}(s) × ${parsing.frequencyPerDay} times/day × ${data.daysSupply} days = ${totalQuantityNeeded} units`,
				assumptions: parsing.isPRN ? ['PRN dosing - using maximum safe frequency'] : [],
				uncertainties: parsing.warnings || []
			};

			// Step 3: Optimize packages with OpenAI
			const optimizationPrompt = buildPackageOptimizerPrompt(
				data.drugName,
				totalQuantityNeeded,
				data.availablePackages.map((p) => ({
					ndc: p.ndc,
					size: p.packageSize,
					manufacturer: p.manufacturer,
					isActive: p.isActive
				})),
				data.daysSupply
			);

			const optimizationCompletion = await getOpenAIClient().chat.completions.create({
				model: 'gpt-4o',
				messages: [
					{
						role: 'system',
						content: 'You are a pharmacy optimization expert. Always return valid JSON.'
					},
					{
						role: 'user',
						content: optimizationPrompt
					}
				],
				temperature: 0.2,
				max_tokens: 1500
			});

			const optimization = parseJSONResponse(
				optimizationCompletion.choices[0].message.content || '{}'
			);

			// Step 4: Generate explanation
			const explanationPrompt = buildExplanationPrompt(
				data.drugName,
				data.instructions,
				data.daysSupply,
				parsing,
				quantity,
				optimization
			);

			const explanationCompletion = await getOpenAIClient().chat.completions.create({
				model: 'gpt-4o',
				messages: [
					{
						role: 'system',
						content: 'You are a pharmaceutical expert creating clear explanations.'
					},
					{
						role: 'user',
						content: explanationPrompt
					}
				],
				temperature: 0.3,
				max_tokens: 500
			});

			const explanation = explanationCompletion.choices[0].message.content || '';

			// Step 5: Save to Firestore
			const calculationRef = admin.firestore().collection('calculations').doc();

			await calculationRef.set({
				userId: context.auth.uid,
				drugName: data.drugName,
				rxcui: data.rxcui,
				instructions: data.instructions,
				daysSupply: data.daysSupply,
				parsing,
				quantity,
				optimization,
				explanation,
				createdAt: admin.firestore.FieldValue.serverTimestamp()
			});

			return {
				calculationId: calculationRef.id,
				parsing,
				quantity,
				optimization,
				explanation
			};
		} catch (error) {
			console.error('Calculation error:', error);
			throw new functions.https.HttpsError(
				'internal',
				'Failed to calculate prescription',
				error
			);
		}
	});

