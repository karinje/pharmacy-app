export function buildPackageOptimizerPrompt(
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

