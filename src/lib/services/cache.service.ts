import { browser } from '$app/environment';

export interface CacheEntry<T> {
	data: T;
	timestamp: number;
	expiresAt: number;
}

class CacheService {
	private cache: Map<string, CacheEntry<any>> = new Map();

	/**
	 * Get cached data if valid
	 */
	get<T>(key: string): T | null {
		if (!browser) return null;

		const entry = this.cache.get(key);

		if (!entry) return null;

		// Check if expired
		if (Date.now() > entry.expiresAt) {
			this.cache.delete(key);
			return null;
		}

		return entry.data as T;
	}

	/**
	 * Set cache entry with TTL
	 */
	set<T>(key: string, data: T, ttl: number): void {
		if (!browser) return;

		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			expiresAt: Date.now() + ttl
		};

		this.cache.set(key, entry);
	}

	/**
	 * Delete specific cache entry
	 */
	delete(key: string): void {
		this.cache.delete(key);
	}

	/**
	 * Clear all cache
	 */
	clear(): void {
		this.cache.clear();
	}

	/**
	 * Clean expired entries
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, entry] of this.cache.entries()) {
			if (now > entry.expiresAt) {
				this.cache.delete(key);
			}
		}
	}

	/**
	 * Get cache stats
	 */
	getStats() {
		return {
			size: this.cache.size,
			entries: Array.from(this.cache.keys())
		};
	}
}

export const cacheService = new CacheService();

// Cleanup expired entries every 5 minutes
if (browser) {
	setInterval(() => cacheService.cleanup(), 5 * 60 * 1000);
}


