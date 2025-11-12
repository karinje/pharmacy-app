// Core domain types
export interface DrugInput {
  drugName: string;
  instructions: string;
  daysSupply: number;
}

export interface RxNormConcept {
  rxcui: string;
  name: string;
  synonym?: string;
  tty?: string;
}

// Re-export FDA types (comprehensive NDCProduct definition)
import type { NDCProduct } from './fda';
export type { NDCProduct, FDANDCResult, FDAIngredient, FDAPackaging, FDASearchResponse } from './fda';

// Re-export OpenAI types
export type {
	InstructionParsing,
	QuantityCalculation,
	PackageOptimization,
	OpenAICalculationRequest,
	OpenAICalculationResponse
} from './openai';

// Re-export Calculation types
export type {
	CalculationInput,
	CalculationResult,
	CalculationProgress,
	Warning
} from './calculation';

// Legacy NDCProduct interface - deprecated, use FDA NDCProduct instead
/** @deprecated Use NDCProduct from './fda' instead */
export interface LegacyNDCProduct {
  ndc: string;
  genericName: string;
  brandName?: string;
  manufacturer: string;
  packageDescription: string;
  packageSize: number;
  packageUnit: string;
  isActive: boolean;
  expirationDate?: string;
}

// Legacy types - deprecated, use types from './calculation' instead
/** @deprecated Use CalculationResult from './calculation' instead */
export interface LegacyCalculationResult {
  id: string;
  input: DrugInput;
  rxnormData: RxNormConcept;
  totalQuantityNeeded: number;
  recommendedPackages: LegacyPackageRecommendation[];
  allNDCs: NDCProduct[];
  explanation: string;
  warnings: LegacyWarning[];
  alternatives: LegacyAlternative[];
  timestamp: Date;
}

/** @deprecated Use PackageRecommendation from './calculation' instead */
export interface LegacyPackageRecommendation {
  ndc: string;
  product: NDCProduct;
  quantity: number;
  totalUnits: number;
  wasteUnits: number;
  wastePercentage: number;
  rank: number;
  reasoning: string;
}

/** @deprecated Use Warning from './calculation' instead */
export interface LegacyWarning {
  type: 'inactive_ndc' | 'quantity_mismatch' | 'package_unavailable' | 'ambiguous_instruction';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

/** @deprecated Use Alternative from './calculation' instead */
export interface LegacyAlternative {
  description: string;
  packages: LegacyPackageRecommendation[];
  pros: string[];
  cons: string[];
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'pharmacist' | 'admin';
  createdAt: Date;
  lastLoginAt: Date;
}

export interface CalculationHistory {
  userId: string;
  calculations: LegacyCalculationResult[];
  totalCalculations: number;
  lastUpdated: Date;
}

