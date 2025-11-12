import type { z } from 'zod';
import type { calculatorFormSchema } from '$lib/utils/calculator-validation';

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

export interface CalculatorState {
	input: CalculatorFormData;
	isCalculating: boolean;
	result: CalculationResult | null;
	error: string | null;
}

export interface CalculationRequest {
	drugName: string;
	instructions: string;
	daysSupply: number;
}

export interface CalculationResult {
	id: string;
	rxnormData: {
		rxcui: string;
		name: string;
	};
	totalQuantityNeeded: number;
	recommendedPackages: PackageRecommendation[];
	explanation: string;
	warnings: Warning[];
	alternatives: Alternative[];
	timestamp: Date;
}

export interface PackageRecommendation {
	ndc: string;
	productName: string;
	manufacturer: string;
	packageSize: number;
	quantity: number;
	totalUnits: number;
	wasteUnits: number;
	wastePercentage: number;
	rank: number;
	reasoning: string;
}

export interface Warning {
	type: string;
	severity: 'high' | 'medium' | 'low';
	message: string;
}

export interface Alternative {
	description: string;
	packages: PackageRecommendation[];
	pros: string[];
	cons: string[];
}

