import { describe, it, expect } from 'vitest';
import { calculatorFormSchema, validateInstructions, MEDICAL_ABBREVIATIONS } from '$lib/utils/calculator-validation';

describe('Calculator Validation', () => {
	describe('calculatorFormSchema', () => {
		it('should validate correct input', () => {
			const input = {
				drugName: 'Metformin 500mg',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30
			};

			const result = calculatorFormSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it('should reject short drug name', () => {
			const input = {
				drugName: 'M',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30
			};

			const result = calculatorFormSchema.safeParse(input);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain('at least 2 characters');
			}
		});

		it('should reject invalid days supply', () => {
			const input = {
				drugName: 'Metformin 500mg',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 0
			};

			const result = calculatorFormSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject days supply over 365', () => {
			const input = {
				drugName: 'Metformin 500mg',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 400
			};

			const result = calculatorFormSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should accept optional RxCUI', () => {
			const input = {
				drugName: 'Metformin 500mg',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30,
				rxcui: '860975'
			};

			const result = calculatorFormSchema.safeParse(input);
			expect(result.success).toBe(true);
		});

		it('should reject invalid RxCUI format', () => {
			const input = {
				drugName: 'Metformin 500mg',
				instructions: 'Take 1 tablet twice daily',
				daysSupply: 30,
				rxcui: 'abc123'
			};

			const result = calculatorFormSchema.safeParse(input);
			expect(result.success).toBe(false);
		});

		it('should reject short instructions', () => {
			const input = {
				drugName: 'Metformin 500mg',
				instructions: 'Take',
				daysSupply: 30
			};

			const result = calculatorFormSchema.safeParse(input);
			expect(result.success).toBe(false);
		});
	});

	describe('validateInstructions', () => {
		it('should recognize BID abbreviation', () => {
			const result = validateInstructions('Take 1 tablet BID');

			expect(result.isValid).toBe(true);
			expect(result.suggestions).toBeDefined();
			expect(result.suggestions?.some((s) => s.includes('BID = twice daily'))).toBe(true);
		});

		it('should recognize multiple abbreviations', () => {
			const result = validateInstructions('Take 1 tablet PO BID');

			expect(result.isValid).toBe(true);
			expect(result.suggestions?.length).toBeGreaterThan(1);
		});

		it('should warn about PRN instructions', () => {
			const result = validateInstructions('Take 1 tablet as needed');

			expect(result.warnings).toBeDefined();
			expect(result.warnings?.some((w) => w.includes('as needed'))).toBe(true);
		});

		it('should warn about missing dosage information', () => {
			const result = validateInstructions('Take twice daily');

			expect(result.warnings).toBeDefined();
			expect(result.warnings?.some((w) => w.includes('dosage amount'))).toBe(true);
		});

		it('should not warn for valid instructions with dosage', () => {
			const result = validateInstructions('Take 1 tablet twice daily');

			expect(result.warnings).toBeUndefined();
		});

		it('should recognize all medical abbreviations', () => {
			Object.keys(MEDICAL_ABBREVIATIONS).forEach((abbr) => {
				const result = validateInstructions(`Take 1 tablet ${abbr}`);
				expect(result.suggestions).toBeDefined();
				expect(result.suggestions?.length).toBeGreaterThan(0);
			});
		});
	});
});

