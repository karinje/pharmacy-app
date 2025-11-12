export function buildInstructionParserPrompt(
	drugName: string,
	instructions: string,
	daysSupply: number
): string {
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

