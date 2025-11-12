export interface RxNormResponse {
	idGroup?: {
		name?: string;
		rxnormId?: string[];
	};
	approximateGroup?: {
		candidate?: RxNormCandidate[];
	};
}

export interface RxNormCandidate {
	rxcui: string;
	name: string;
	score: string;
	rank: string;
}

export interface RxNormConcept {
	rxcui: string;
	name: string;
	synonym?: string;
	tty?: string; // Term Type (SCD, SBD, GPCK, etc.)
	language?: string;
	suppress?: string;
	umlscui?: string;
}

export interface RxNormNDC {
	ndcItem?: {
		packaged?: string;
		ndcCode?: string;
		ndc11?: string;
	};
	conceptProperties?: {
		rxcui?: string;
		name?: string;
		synonym?: string;
		tty?: string;
		language?: string;
	};
}

export interface NormalizedDrug {
	rxcui: string;
	name: string;
	originalInput: string;
	confidence: 'high' | 'medium' | 'low';
	alternatives: RxNormCandidate[];
}

