import { z } from 'zod';

export const calculatorFormSchema = z.object({
	drugName: z
		.string()
		.min(2, 'Drug name must be at least 2 characters')
		.max(200, 'Drug name is too long')
		.regex(/^[a-zA-Z0-9\s\-()]+$/, 'Drug name contains invalid characters'),

	rxcui: z
		.string()
		.optional()
		.refine((val) => !val || /^\d+$/.test(val), 'RxCUI must be numeric'),

	instructions: z
		.string()
		.min(5, 'Instructions must be at least 5 characters')
		.max(500, 'Instructions are too long'),

	daysSupply: z
		.number()
		.int('Days supply must be a whole number')
		.min(1, 'Days supply must be at least 1 day')
		.max(365, 'Days supply cannot exceed 365 days')
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

// Common medical abbreviations and patterns
export const MEDICAL_ABBREVIATIONS = {
	QD: 'once daily',
	BID: 'twice daily',
	TID: 'three times daily',
	QID: 'four times daily',
	Q4H: 'every 4 hours',
	Q6H: 'every 6 hours',
	Q8H: 'every 8 hours',
	Q12H: 'every 12 hours',
	PRN: 'as needed',
	PO: 'by mouth',
	HS: 'at bedtime',
	AC: 'before meals',
	PC: 'after meals'
};

export function validateInstructions(instructions: string): {
	isValid: boolean;
	suggestions?: string[];
	warnings?: string[];
} {
	const upperInstructions = instructions.toUpperCase();
	const suggestions: string[] = [];
	const warnings: string[] = [];

	// Check for common abbreviations
	Object.entries(MEDICAL_ABBREVIATIONS).forEach(([abbr, meaning]) => {
		if (upperInstructions.includes(abbr)) {
			suggestions.push(`${abbr} = ${meaning}`);
		}
	});

	// Check for ambiguous instructions
	if (upperInstructions.includes('AS NEEDED') || upperInstructions.includes('PRN')) {
		warnings.push('Instructions include "as needed" - quantity may vary');
	}

	// Check for missing dosage information
	if (!/\d+\s*(tablet|capsule|ml|unit|puff)/i.test(instructions)) {
		warnings.push('Instructions may be missing dosage amount');
	}

	return {
		isValid: true,
		suggestions: suggestions.length > 0 ? suggestions : undefined,
		warnings: warnings.length > 0 ? warnings : undefined
	};
}

