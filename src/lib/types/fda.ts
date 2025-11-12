export interface FDANDCResult {
	product_ndc: string;
	generic_name: string;
	labeler_name: string;
	brand_name?: string;
	dosage_form: string;
	route: string[];
	marketing_category: string;
	application_number: string;
	active_ingredients: FDAIngredient[];
	packaging: FDAPackaging[];
	listing_expiration_date?: string;
	marketing_status: string;
	finished: boolean;
}

export interface FDAIngredient {
	name: string;
	strength: string;
}

export interface FDAPackaging {
	package_ndc: string;
	description: string;
	marketing_start_date: string;
	sample?: boolean;
}

export interface FDASearchResponse {
	meta: {
		disclaimer: string;
		terms: string;
		license: string;
		last_updated: string;
		results: {
			skip: number;
			limit: number;
			total: number;
		};
	};
	results: FDANDCResult[];
}

export interface NDCProduct {
	ndc: string;
	ndc11: string; // Normalized 11-digit format
	genericName: string;
	brandName?: string;
	manufacturer: string;
	packageDescription: string;
	packageSize: number;
	packageUnit: string;
	isActive: boolean;
	marketingStatus: string;
	expirationDate?: Date;
	dosageForm: string;
	route: string[];
	strength: string;
}

