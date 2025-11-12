export function buildExplanationPrompt(
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

