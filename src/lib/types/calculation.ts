import type { NDCProduct } from './fda';
import type { InstructionParsing, QuantityCalculation, PackageOptimization } from './openai';

export interface CalculationInput {
	drugName: string;
	rxcui?: string; // Optional RxCUI from autocomplete selection (CTSS/RxNorm)
	instructions: string;
	daysSupply: number;
}

export interface CalculationResult {
	id: string;

	// Input
	input: CalculationInput;

	// RxNorm data
	rxnormData: {
		rxcui: string;
		name: string;
		confidence: 'high' | 'medium' | 'low';
	};

	// FDA data
	allProducts: NDCProduct[];
	activeProducts: NDCProduct[];
	inactiveProducts: NDCProduct[];

	// OpenAI analysis
	parsing: InstructionParsing;
	quantity: QuantityCalculation;
	optimization: PackageOptimization;
	explanation: string;

	// Warnings
	warnings: Warning[];

	// Metadata
	timestamp: Date;
	userId?: string;
}

export interface Warning {
	type: 'parsing' | 'rxnorm' | 'fda' | 'optimization' | 'inactive_ndc';
	severity: 'high' | 'medium' | 'low';
	message: string;
	details?: unknown;
}

export interface CalculationProgress {
	stage: 'normalizing' | 'fetching_ndcs' | 'calculating' | 'optimizing' | 'complete' | 'error';
	message: string;
	progress: number; // 0-100
}

