import { env } from '$lib/config/env';
import { CACHE_DURATION } from '$lib/config/constants';
import { cacheService } from './cache.service';
import { fetchWithTimeout, retryWithBackoff, buildQueryString, ApiError } from '$lib/utils/api-helpers';
import type { FDASearchResponse, FDANDCResult, NDCProduct } from '$lib/types/fda';

class FDAService {
	private baseUrl = env.fda.baseUrl;
	private resultsLimit = 100;

	/**
	 * Normalize NDC to 11-digit format
	 * NDCs can be in formats: 5-4-2, 5-3-2, 4-4-2
	 * Standard format: labeler (5) + product (4) + package (2) = 11 digits
	 */
	normalizeNDC(ndc: string): string {
		// Remove hyphens
		const digits = ndc.replace(/-/g, '');

		// If already 11 digits, return as-is
		if (digits.length === 11) {
			return digits;
		}

		// Parse format from original NDC (with hyphens)
		const parts = ndc.split('-');
		
		if (parts.length === 3) {
			// Format: labeler-product-package
			const [labeler, product, package_code] = parts;
			
			// Pad labeler to 5 digits
			const labelerPadded = labeler.padStart(5, '0');
			
			// Pad product to 4 digits
			const productPadded = product.padStart(4, '0');
			
			// Pad package to 2 digits
			const packagePadded = package_code.padStart(2, '0');
			
			return `${labelerPadded}${productPadded}${packagePadded}`;
		} else if (parts.length === 2) {
			// Format: labeler-product (no package code)
			const [labeler, product] = parts;
			const labelerPadded = labeler.padStart(5, '0');
			const productPadded = product.padStart(4, '0');
			return `${labelerPadded}${productPadded}00`; // Default package code
		}

		// If no hyphens, pad to 11 digits
		return digits.padStart(11, '0');
	}

	/**
	 * Parse package size from description
	 */
	private parsePackageSize(description: string): { size: number; unit: string } {
		// Examples:
		// "100 TABLET in 1 BOTTLE"
		// "30 CAPSULE in 1 BLISTER PACK"
		// "10 mL in 1 VIAL"

		const match = description.match(/^(\d+(?:\.\d+)?)\s+(\w+)/i);
		if (match) {
			return {
				size: parseFloat(match[1]),
				unit: match[2].toUpperCase()
			};
		}

		return { size: 0, unit: 'UNIT' };
	}

	/**
	 * Clean drug name for FDA search - remove parentheticals, extra descriptors
	 */
	private cleanDrugNameForSearch(name: string): string {
		// Remove parenthetical content like "(Oral Pill)", "(Tablet)", etc.
		let cleaned = name.replace(/\s*\([^)]*\)/g, '').trim();
		
		// Remove common suffixes that aren't part of generic name (case-insensitive, word boundary)
		cleaned = cleaned.replace(/\s+(Oral|Pill|Tablet|Capsule|Injection|Solution|Oral Pill)\s*$/i, '').trim();
		
		// Convert to lowercase for consistent searching
		return cleaned.toLowerCase();
	}

	/**
	 * Get ingredient name from RxNorm using RxCUI
	 * Returns the ingredient (IN) or precise ingredient (PIN) name that FDA would recognize
	 */
	private async getIngredientNameFromRxNorm(rxcui: string): Promise<string | null> {
		try {
			console.log(`[FDA] Getting ingredient name from RxNorm for RxCUI: ${rxcui}`);
			
			// RxNorm API: Get all related concepts, then filter for IN/PIN
			// Note: Some RxCUIs may not have related concepts, which returns 400
			const url = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json`;
			const response = await fetch(url);
			
			if (!response.ok) {
				// 400 usually means no related concepts exist for this RxCUI - not an error
				if (response.status === 400) {
					console.log(`[FDA] RxCUI ${rxcui} has no related concepts (common for brand names)`);
				} else {
					console.warn(`[FDA] RxNorm API returned ${response.status} for RxCUI ${rxcui}`);
				}
				return null;
			}

			const data = await response.json();
			console.log(`[FDA] RxNorm response for RxCUI ${rxcui}:`, JSON.stringify(data).substring(0, 500));
			
			const relatedGroup = data.relatedGroup?.conceptGroup;
			
			if (!relatedGroup || !Array.isArray(relatedGroup)) {
				console.warn(`[FDA] No conceptGroup found in RxNorm response for RxCUI ${rxcui}`);
				return null;
			}

			// Find IN (Ingredient) first, fallback to PIN (Precise Ingredient)
			for (const group of relatedGroup) {
				if (group.tty === 'IN' || group.tty === 'PIN') {
					const concepts = group.conceptProperties;
					if (concepts && concepts.length > 0) {
						const ingredientName = concepts[0].name;
						const cleaned = this.cleanDrugNameForSearch(ingredientName);
						console.log(`[FDA] Found ingredient name for RxCUI ${rxcui}: "${ingredientName}" -> "${cleaned}"`);
						return cleaned;
					}
				}
			}

			console.warn(`[FDA] No IN/PIN found in RxNorm response for RxCUI ${rxcui}`);
			return null;
		} catch (error) {
			console.warn(`[FDA] Failed to get ingredient name from RxNorm for RxCUI ${rxcui}:`, error);
			return null;
		}
	}

	/**
	 * Get active NDCs for a drug by generic name
	 * @param genericName - Drug name to search for
	 * @param rxcui - Optional RxCUI to get ingredient name from RxNorm
	 */
	async searchNDCsByDrugName(genericName: string, rxcui?: string): Promise<NDCProduct[]> {
		// Clean the name for search
		const cleanedName = this.cleanDrugNameForSearch(genericName);
		const cacheKey = `fda:search:${cleanedName}${rxcui ? `:${rxcui}` : ''}`;

		const cached = cacheService.get<NDCProduct[]>(cacheKey);
		if (cached) return cached;

		// If we have an RxCUI, try to get the ingredient name from RxNorm
		let ingredientName: string | null = null;
		if (rxcui) {
			console.log(`[FDA] RxCUI provided (${rxcui}), fetching ingredient name from RxNorm...`);
			ingredientName = await this.getIngredientNameFromRxNorm(rxcui);
			if (ingredientName) {
				console.log(`[FDA] Using ingredient name "${ingredientName}" for FDA search (original: "${cleanedName}")`);
			} else {
				console.log(`[FDA] Could not get ingredient name from RxNorm, using original name "${cleanedName}"`);
			}
		} else {
			console.log(`[FDA] No RxCUI provided, using drug name "${cleanedName}" for search`);
		}

		const searchStrategies = [
			// Strategy 1: Exact match with quotes (most specific)
			`generic_name:"${cleanedName}"`,
			// Strategy 2: Exact match without quotes (allows partial matches)
			`generic_name:${cleanedName}`,
			// Strategy 3: Try brand name (some drugs are listed by brand)
			`brand_name:"${cleanedName}"`,
			// Strategy 4: Try first word only (for compound names)
			cleanedName.split(/\s+/).length > 1 ? `generic_name:"${cleanedName.split(/\s+/)[0]}"` : null,
			// Strategy 5: Case-insensitive search (FDA sometimes has uppercase)
			`generic_name:"${cleanedName.toUpperCase()}"`,
			// Strategy 6: If we got ingredient name from RxNorm, try that
			ingredientName && ingredientName !== cleanedName ? `generic_name:"${ingredientName}"` : null,
			ingredientName && ingredientName !== cleanedName ? `generic_name:${ingredientName}` : null
		].filter((strategy): strategy is string => strategy !== null);

		let lastError: Error | null = null;

		for (const queryStr of searchStrategies) {
			try {
				const params = {
					search: queryStr,
					limit: this.resultsLimit
				};

				const queryString = buildQueryString(params);
				const url = `${this.baseUrl}?${queryString}`;

				const response = await retryWithBackoff(async () => {
					return fetchWithTimeout(url);
				});

				// Check if response is ok
				if (!response.ok) {
					if (response.status === 404) {
						continue; // Try next strategy
					}
					throw new Error(`FDA API returned status ${response.status}`);
				}

				const data: FDASearchResponse = await response.json();

				if (data.results && data.results.length > 0) {
					// Transform FDA results to our product format
					const products = this.transformFDAResults(data.results);

					// Cache for 24 hours
					cacheService.set(cacheKey, products, CACHE_DURATION.FDA_NDC);

					console.log(`FDA search succeeded for "${cleanedName}" using query: ${queryStr} (found ${products.length} products)`);
					return products;
				}
			} catch (error) {
				// Log error but continue to next strategy
				console.warn(`FDA search failed for "${cleanedName}" with query "${queryStr}":`, error);
				lastError = error instanceof Error ? error : new Error(String(error));
				continue;
			}
		}

		// All strategies failed
		console.error(`All FDA search strategies failed for "${cleanedName}"`);
		if (lastError instanceof ApiError && lastError.status === 404) {
			return [];
		}
		throw new ApiError(
			`Failed to search NDCs for "${genericName}". The drug may not be in the FDA database or may be listed under a different name.`,
			500,
			'FDA',
			lastError
		);
	}

	/**
	 * Validate specific NDC code
	 */
	async validateNDC(ndc: string): Promise<NDCProduct | null> {
		// Use original NDC for cache key (preserve format)
		const cacheKey = `fda:ndc:${ndc}`;

		// Use a wrapper to distinguish "not cached" from "cached as null"
		const cacheKeyWrapper = `fda:ndc:wrapper:${ndc}`;
		const cachedWrapper = cacheService.get<{ value: NDCProduct | null }>(cacheKeyWrapper);
		if (cachedWrapper !== null) return cachedWrapper.value;

		// Fallback: check old cache format for backwards compatibility
		const cached = cacheService.get<NDCProduct>(cacheKey);
		if (cached !== null) {
			// Migrate to wrapper format
			cacheService.set(cacheKeyWrapper, { value: cached }, CACHE_DURATION.FDA_NDC);
			return cached;
		}

		try {
			// FDA API doesn't support direct package_ndc search
			// Strategy: Extract product_ndc from package_ndc, search by product_ndc, then filter
			const parts = ndc.split('-');
			let productNDC: string | null = null;
			
			if (parts.length === 3) {
				// Full package NDC: labeler-product-package
				productNDC = `${parts[0]}-${parts[1]}`;
			} else if (parts.length === 2) {
				// Product NDC: labeler-product
				productNDC = ndc;
			}
			
			// If we have a product NDC, search by it
			if (productNDC) {
				const params = {
					search: `product_ndc:"${productNDC}"`,
					limit: this.resultsLimit
				};

				const queryString = buildQueryString(params);
				const url = `${this.baseUrl}?${queryString}`;

				const response = await fetchWithTimeout(url);
				const data: FDASearchResponse = await response.json();

				if (data.results && data.results.length > 0) {
					// Transform all results to get all packages
					const allProducts = this.transformFDAResults(data.results);
					
					// Find the specific package NDC
					const matchingProduct = allProducts.find(p => 
						p.ndc === ndc || p.ndc11 === this.normalizeNDC(ndc)
					);
					
					if (matchingProduct) {
						cacheService.set(cacheKeyWrapper, { value: matchingProduct }, CACHE_DURATION.FDA_NDC);
						return matchingProduct;
					}
				}
			}

			// No results found
			cacheService.set(cacheKeyWrapper, { value: null }, CACHE_DURATION.FDA_NDC);
			return null;
		} catch (error) {
			// 404 is expected for invalid NDCs - return null silently
			if (error instanceof ApiError && error.status === 404) {
				cacheService.set(cacheKeyWrapper, { value: null }, CACHE_DURATION.FDA_NDC);
				return null;
			}
			// Re-throw other errors
			throw error;
		}
	}

	/**
	 * Get all packages for a product NDC
	 */
	async getProductPackages(productNDC: string): Promise<NDCProduct[]> {
		const cacheKey = `fda:packages:${productNDC}`;

		const cached = cacheService.get<NDCProduct[]>(cacheKey);
		if (cached) return cached;

		try {
			const params = {
				search: `product_ndc:"${productNDC}"`,
				limit: this.resultsLimit
			};

			const queryString = buildQueryString(params);
			const url = `${this.baseUrl}?${queryString}`;

			const response = await fetchWithTimeout(url);
			const data: FDASearchResponse = await response.json();

			if (!data.results || data.results.length === 0) {
				return [];
			}

			const products = this.transformFDAResults(data.results);

			cacheService.set(cacheKey, products, CACHE_DURATION.FDA_NDC);

			return products;
		} catch (error) {
			throw new ApiError('Failed to get product packages', 500, 'FDA', error);
		}
	}

	/**
	 * Transform FDA API results to our format
	 */
	private transformFDAResults(results: FDANDCResult[]): NDCProduct[] {
		const products: NDCProduct[] = [];

		for (const result of results) {
			// Process each package
			if (result.packaging) {
				for (const pkg of result.packaging) {
					const { size, unit } = this.parsePackageSize(pkg.description);

					// Check if product is active
					const isActive = this.isProductActive(
						result.marketing_status,
						result.listing_expiration_date
					);

					// Safely parse expiration date
					let expirationDate: Date | undefined = undefined;
					if (result.listing_expiration_date) {
						const parsedDate = new Date(result.listing_expiration_date);
						if (!isNaN(parsedDate.getTime())) {
							expirationDate = parsedDate;
						}
					}

					products.push({
						ndc: pkg.package_ndc,
						ndc11: this.normalizeNDC(pkg.package_ndc),
						genericName: result.generic_name,
						brandName: result.brand_name,
						manufacturer: result.labeler_name,
						packageDescription: pkg.description,
						packageSize: size,
						packageUnit: unit,
						isActive,
						marketingStatus: result.marketing_status,
						expirationDate,
						dosageForm: result.dosage_form,
						route: result.route,
						strength: result.active_ingredients && Array.isArray(result.active_ingredients)
							? result.active_ingredients
								.map((ing) => `${ing.name} ${ing.strength}`)
								.join(', ')
							: ''
					});
				}
			}
		}

		return products;
	}

	/**
	 * Check if product is currently active
	 */
	private isProductActive(marketingStatus: string | null | undefined, expirationDate?: string): boolean {
		// If marketing status is null/undefined, check expiration date only
		// Many FDA products have null marketing_status but are still active
		if (!marketingStatus) {
			// If no expiration date or expiration is in future, assume active
			if (!expirationDate) {
				return true; // No expiration = assume active
			}
			try {
				const expDate = new Date(expirationDate);
				const now = new Date();
				// Allow 30 day grace period
				return expDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			} catch (e) {
				// Bad date format = assume active
				return true;
			}
		}

		// Normalize marketing status for comparison
		const status = marketingStatus.toLowerCase().trim();
		
		// Check marketing status - FDA returns various formats
		// Accept: "Prescription", "Over-the-counter", "OTC", "RX", "Rx", etc.
		const activeStatuses = [
			'prescription',
			'over-the-counter',
			'over the counter',
			'otc',
			'rx',
			'prescription only'
		];
		
		const isActiveStatus = activeStatuses.some((active) => status.includes(active));
		
		// If status explicitly says inactive/discontinued, reject
		const inactiveStatuses = ['discontinued', 'unapproved', 'withdrawn'];
		if (inactiveStatuses.some((inactive) => status.includes(inactive))) {
			return false;
		}
		
		// If we have an active status, check expiration
		if (isActiveStatus) {
			// Check expiration date (if provided)
			if (expirationDate) {
				try {
					const expDate = new Date(expirationDate);
					const now = new Date();
					// Allow 30 day grace period for expiration dates
					if (expDate < new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) {
						return false;
					}
				} catch (e) {
					// If date parsing fails, assume active
					return true;
				}
			}
			return true;
		}

		// Unknown status - if no expiration or future expiration, assume active
		if (!expirationDate) {
			return true;
		}
		try {
			const expDate = new Date(expirationDate);
			const now = new Date();
			return expDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		} catch (e) {
			return true;
		}
	}

	/**
	 * Get active NDCs from list
	 */
	filterActiveNDCs(products: NDCProduct[]): NDCProduct[] {
		return products.filter((p) => p.isActive);
	}

	/**
	 * Get inactive NDCs from list
	 */
	filterInactiveNDCs(products: NDCProduct[]): NDCProduct[] {
		return products.filter((p) => !p.isActive);
	}

	/**
	 * Clear FDA cache
	 */
	clearCache(): void {
		cacheService.clear();
	}
}

export const fdaService = new FDAService();

