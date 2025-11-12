export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public endpoint: string,
		public details?: unknown
	) {
		super(message);
		this.name = 'ApiError';
	}
}

export async function fetchWithTimeout(
	url: string,
	options: RequestInit = {},
	timeout: number = 30000
): Promise<Response> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal
		});

		if (!response.ok) {
			throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status, url);
		}

		return response;
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') {
			throw new ApiError('Request timeout', 408, url);
		}
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

export function buildQueryString(params: Record<string, string | number>): string {
	return Object.entries(params)
		.filter(([_, value]) => value !== undefined && value !== null)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		.join('&');
}

export async function retryWithBackoff<T>(
	fn: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 1000
): Promise<T> {
	let lastError: Error;

	for (let i = 0; i < maxRetries; i++) {
		try {
			return await fn();
		} catch (error) {
			lastError = error as Error;

			// Don't retry on client errors (4xx)
			if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
				throw error;
			}

			// Wait with exponential backoff
			if (i < maxRetries - 1) {
				const delay = baseDelay * Math.pow(2, i);
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError!;
}

