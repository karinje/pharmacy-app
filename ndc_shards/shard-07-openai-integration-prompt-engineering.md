# SHARD 7: OpenAI Integration & Prompt Engineering

## Status: 🔜 READY TO START

## Objective
Integrate OpenAI GPT-4o for intelligent parsing of prescription instructions, quantity calculations, and package optimization with detailed reasoning.

## Dependencies
- ✅ Shard 1 (Project Foundation) - COMPLETE
- ✅ Shard 4 (Calculator Form) - COMPLETE
- ✅ Shard 5 (RxNorm Integration) - COMPLETE
- ✅ Shard 6 (FDA Integration) - COMPLETE

## Context from Shard 6

**Completed FDA Integration:**
- `fda.service.ts` - Client-side FDA service with full NDC validation
- `validateNDC` Cloud Function - Server-side NDC validation with Firestore caching
- `NDCProduct` interface - Comprehensive product data structure
- NDC normalization to 11-digit format (handles 5-4-2, 5-3-2, 4-4-2 formats)
- Package size/unit parsing from FDA descriptions
- Active/inactive product filtering
- Client-side caching (24 hours) and server-side Firestore caching (24 hours)

**Available from FDA Service:**
- `searchNDCsByDrugName(genericName)` - Search NDCs by generic drug name
- `validateNDC(ndc)` - Validate specific NDC code, returns `NDCProduct | null`
- `getProductPackages(productNDC)` - Get all packages for a product
- `filterActiveNDCs(products)` - Filter active products
- `filterInactiveNDCs(products)` - Filter inactive products
- `normalizeNDC(ndc)` - Normalize NDC to 11-digit format

**NDCProduct Structure:**
```typescript
{
  ndc: string;                    // Original format (e.g., "72288-050-60")
  ndc11: string;                  // Normalized 11-digit format
  genericName: string;
  brandName?: string;
  manufacturer: string;
  packageDescription: string;
  packageSize: number;             // Parsed from description
  packageUnit: string;             // TABLET, CAPSULE, mL, etc.
  isActive: boolean;
  marketingStatus: string;
  expirationDate?: Date;
  dosageForm: string;
  route: string[];
  strength: string;
}
```

**Integration Points for OpenAI:**
- Use `searchNDCsByDrugName()` to get available packages after RxNorm normalization
- Filter active NDCs using `filterActiveNDCs()` before sending to OpenAI
- Include `packageSize`, `packageUnit`, `manufacturer` in optimization prompts
- Use `isActive` flag to warn about inactive products
- Normalize NDCs using `normalizeNDC()` for consistent comparison

## Files to Create/Modify

```
src/
├── lib/
│   ├── services/
│   │   └── openai.service.ts            # NEW: OpenAI API client
│   ├── prompts/
│   │   ├── instruction-parser.ts        # NEW: Instruction parsing prompts
│   │   ├── package-optimizer.ts         # NEW: Package optimization prompts
│   │   └── explanation-generator.ts     # NEW: Explanation prompts
│   └── types/
│       └── openai.ts                    # NEW: OpenAI-specific types
└── functions/
    └── src/
        └── openai/
            ├── calculate.ts             # NEW: Main calculation function
            └── index.ts                 # MODIFY: Add OpenAI exports
```

## Implementation Details

### 1. OpenAI Types (`src/lib/types/openai.ts`)
```typescript
export interface InstructionParsing {
  dosageAmount: number;
  dosageUnit: string;
  frequency: string;
  frequencyPerDay: number;
  specialInstructions?: string;
  isPRN: boolean;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  warnings: string[];
}

export interface QuantityCalculation {
  dailyQuantity: number;
  totalQuantityNeeded: number;
  calculation: string;
  assumptions: string[];
  uncertainties: string[];
}

export interface PackageOptimization {
  recommendedPackages: Array<{
    ndc: string;
    quantity: number;
    totalUnits: number;
    wasteUnits: number;
    wastePercentage: number;
    rank: number;
  }>;
  reasoning: string;
  alternatives: Array<{
    description: string;
    packages: Array<{
      ndc: string;
      quantity: number;
    }>;
    pros: string[];
    cons: string[];
  }>;
}

export interface OpenAICalculationRequest {
  drugName: string;
  rxcui: string;
  instructions: string;
  daysSupply: number;
  availablePackages: Array<{
    ndc: string;
    ndc11: string;              // Normalized 11-digit format
    genericName: string;
    brandName?: string;
    manufacturer: string;
    packageSize: number;        // Parsed from FDA description
    packageUnit: string;        // TABLET, CAPSULE, mL, etc.
    isActive: boolean;
    marketingStatus: string;
    dosageForm: string;
    strength: string;
  }>;
}

export interface OpenAICalculationResponse {
  parsing: InstructionParsing;
  quantity: QuantityCalculation;
  optimization: PackageOptimization;
  overallConfidence: 'high' | 'medium' | 'low';
  warnings: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    message: string;
  }>;
}
```

### 2. Instruction Parser Prompts (`src/lib/prompts/instruction-parser.ts`)
```typescript
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
```

### 3. Package Optimizer Prompts (`src/lib/prompts/package-optimizer.ts`)
```typescript
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
  const activePackages = availablePackages.filter(p => p.isActive);
  const inactivePackages = availablePackages.filter(p => !p.isActive);

  return `You are a pharmacy optimization expert. Your task is to recommend the best NDC package combinations for dispensing medication.

DRUG: ${drugName}
TOTAL QUANTITY NEEDED: ${totalQuantityNeeded} units
DAYS SUPPLY: ${daysSupply} days

AVAILABLE ACTIVE PACKAGES:
${activePackages.map(p => `- NDC ${p.ndc}: ${p.size} units (${p.manufacturer})`).join('\n')}

${inactivePackages.length > 0 ? `INACTIVE PACKAGES (DO NOT RECOMMEND):
${inactivePackages.map(p => `- NDC ${p.ndc}: ${p.size} units (${p.manufacturer}) [INACTIVE]`).join('\n')}` : ''}

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
```

### 3. Explanation Generator Prompts (`src/lib/prompts/explanation-generator.ts`)
```typescript
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
```

### 4. OpenAI Service (`src/lib/services/openai.service.ts`)
```typescript
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
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: 'You are a pharmaceutical calculation expert. Always return valid JSON when requested. Be precise and conservative in your calculations.'
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
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
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
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

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
      availablePackages,
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
    const prompt = buildExplanationPrompt(
      drugName,
      instructions,
      daysSupply,
      parsing,
      quantity,
      optimization
    );

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
    const quantity = await this.calculateQuantity(
      parsing,
      request.daysSupply
    );

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
    const warnings = [
      ...parsing.warnings.map(w => ({
        type: 'parsing',
        severity: 'medium' as const,
        message: w
      })),
      ...quantity.uncertainties.map(u => ({
        type: 'calculation',
        severity: 'low' as const,
        message: u
      }))
    ];

    // Check for inactive NDCs
    const hasInactiveNDCs = request.availablePackages.some(p => !p.isActive);
    if (hasInactiveNDCs) {
      warnings.push({
        type: 'inactive_ndc',
        severity: 'high',
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
```

### 5. Prompt Index (`src/lib/prompts/index.ts`)
```typescript
export { buildInstructionParserPrompt } from './instruction-parser';
export { buildPackageOptimizerPrompt } from './package-optimizer';
export { buildExplanationPrompt } from './explanation-generator';
```

### 6. OpenAI Cloud Function (`functions/src/openai/calculate.ts`)
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: functions.config().openai.key
});

interface CalculateRequest {
  drugName: string;
  rxcui: string;
  instructions: string;
  daysSupply: number;
  availablePackages: Array<{
    ndc: string;
    size: number;
    manufacturer: string;
    isActive: boolean;
  }>;
}

/**
 * Main calculation Cloud Function
 * Orchestrates RxNorm, FDA, and OpenAI services
 */
export const calculatePrescription = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '512MB'
  })
  .https.onCall(async (data: CalculateRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    try {
      // Step 1: Parse instructions with OpenAI
      const parsingPrompt = buildInstructionParserPrompt(
        data.drugName,
        data.instructions,
        data.daysSupply
      );

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

      const parsing = JSON.parse(
        parsingCompletion.choices[0].message.content || '{}'
      );

      // Step 2: Calculate quantity
      const dailyQuantity = parsing.dosageAmount * parsing.frequencyPerDay;
      const totalQuantityNeeded = dailyQuantity * data.daysSupply;

      // Step 3: Optimize packages with OpenAI
      const optimizationPrompt = buildPackageOptimizerPrompt(
        data.drugName,
        totalQuantityNeeded,
        data.availablePackages,
        data.daysSupply
      );

      const optimizationCompletion = await openai.chat.completions.create({
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

      const optimization = JSON.parse(
        optimizationCompletion.choices[0].message.content || '{}'
      );

      // Step 4: Generate explanation
      const explanationPrompt = buildExplanationPrompt(
        data.drugName,
        data.instructions,
        data.daysSupply,
        parsing,
        { dailyQuantity, totalQuantityNeeded },
        optimization
      );

      const explanationCompletion = await openai.chat.completions.create({
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

      const explanation = explanationCompletion.choices[0].message.content;

      // Step 5: Save to Firestore
      const calculationRef = admin.firestore().collection('calculations').doc();
      
      await calculationRef.set({
        userId: context.auth.uid,
        drugName: data.drugName,
        rxcui: data.rxcui,
        instructions: data.instructions,
        daysSupply: data.daysSupply,
        parsing,
        totalQuantityNeeded,
        optimization,
        explanation,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        calculationId: calculationRef.id,
        parsing,
        totalQuantityNeeded,
        optimization,
        explanation
      };
    } catch (error) {
      console.error('Calculation error:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to calculate prescription'
      );
    }
  });

// Helper functions (same as in client prompts)
function buildInstructionParserPrompt(drugName: string, instructions: string, daysSupply: number): string {
  // ... same as client version
}

function buildPackageOptimizerPrompt(/* params */): string {
  // ... same as client version
}

function buildExplanationPrompt(/* params */): string {
  // ... same as client version
}
```

### 7. Update Function Exports (`functions/src/index.ts`)
```typescript
export { normalizeDrugName } from './rxnorm/normalize';
export { validateNDC } from './fda/validate-ndc';
export { calculatePrescription } from './openai/calculate';
```

### 8. Functions Configuration (`.firebaserc`)
```json
{
  "projects": {
    "default": "your-project-id"
  },
  "functions": {
    "openai": {
      "key": "your-openai-api-key"
    }
  }
}
```

## Validation Checklist

- [ ] OpenAI API calls successful
- [ ] Instruction parsing extracts correct information
- [ ] Quantity calculations accurate
- [ ] Package optimization provides reasonable recommendations
- [ ] Explanations are clear and professional
- [ ] JSON parsing handles all response formats
- [ ] Error handling for API failures
- [ ] Retry logic works correctly
- [ ] Cloud Function processes complete workflow
- [ ] Results saved to Firestore

## Success Criteria

✅ OpenAI integration complete  
✅ All prompts engineered and tested  
✅ Parsing accuracy >90%  
✅ Quantity calculations correct  
✅ Package recommendations logical  
✅ Explanations clear and helpful  
✅ Error handling comprehensive

---
