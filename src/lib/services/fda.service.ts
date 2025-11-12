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
	 * Get active NDCs for a drug by generic name
	 */
	async searchNDCsByDrugName(genericName: string): Promise<NDCProduct[]> {
		const cacheKey = `fda:search:${genericName.toLowerCase()}`;

		const cached = cacheService.get<NDCProduct[]>(cacheKey);
		if (cached) return cached;

		try {
			// Build FDA API query
			const query = `generic_name:"${genericName}"`;
			const params = {
				search: query,
				limit: this.resultsLimit
			};

			const queryString = buildQueryString(params);
			const url = `${this.baseUrl}?${queryString}`;

			const response = await retryWithBackoff(async () => {
				return fetchWithTimeout(url);
			});

			const data: FDASearchResponse = await response.json();

			if (!data.results || data.results.length === 0) {
				return [];
			}

			// Transform FDA results to our product format
			const products = this.transformFDAResults(data.results);

			// Cache for 24 hours
			cacheService.set(cacheKey, products, CACHE_DURATION.FDA_NDC);

			return products;
		} catch (error) {
			if (error instanceof ApiError && error.status === 404) {
				return [];
			}
			throw new ApiError('Failed to search NDCs', 500, 'FDA', error);
		}
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
						expirationDate: result.listing_expiration_date
							? new Date(result.listing_expiration_date)
							: undefined,
						dosageForm: result.dosage_form,
						route: result.route,
						strength: result.active_ingredients
							.map((ing) => `${ing.name} ${ing.strength}`)
							.join(', ')
					});
				}
			}
		}

		return products;
	}

	/**
	 * Check if product is currently active
	 */
	private isProductActive(marketingStatus: string, expirationDate?: string): boolean {
		// Check marketing status
		if (marketingStatus !== 'Prescription' && marketingStatus !== 'Over-the-counter') {
			return false;
		}

		// Check expiration date
		if (expirationDate) {
			const expDate = new Date(expirationDate);
			if (expDate < new Date()) {
				return false;
			}
		}

		return true;
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

