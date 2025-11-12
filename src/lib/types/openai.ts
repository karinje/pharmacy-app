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
		ndc11: string; // Normalized 11-digit format
		genericName: string;
		brandName?: string;
		manufacturer: string;
		packageSize: number; // Parsed from FDA description
		packageUnit: string; // TABLET, CAPSULE, mL, etc.
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

