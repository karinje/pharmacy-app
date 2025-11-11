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

export interface NDCProduct {
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

export interface CalculationResult {
  id: string;
  input: DrugInput;
  rxnormData: RxNormConcept;
  totalQuantityNeeded: number;
  recommendedPackages: PackageRecommendation[];
  allNDCs: NDCProduct[];
  explanation: string;
  warnings: Warning[];
  alternatives: Alternative[];
  timestamp: Date;
}

export interface PackageRecommendation {
  ndc: string;
  product: NDCProduct;
  quantity: number;
  totalUnits: number;
  wasteUnits: number;
  wastePercentage: number;
  rank: number;
  reasoning: string;
}

export interface Warning {
  type: 'inactive_ndc' | 'quantity_mismatch' | 'package_unavailable' | 'ambiguous_instruction';
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface Alternative {
  description: string;
  packages: PackageRecommendation[];
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
  calculations: CalculationResult[];
  totalCalculations: number;
  lastUpdated: Date;
}

