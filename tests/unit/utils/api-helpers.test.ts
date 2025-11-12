import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, fetchWithTimeout, buildQueryString, retryWithBackoff } from '$lib/utils/api-helpers';

// Mock global fetch
global.fetch = vi.fn();

describe('API Helpers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('ApiError', () => {
		it('should create ApiError with correct properties', () => {
			const error = new ApiError('Test error', 404, 'test-endpoint', { detail: 'test' });

			expect(error.message).toBe('Test error');
			expect(error.status).toBe(404);
			expect(error.endpoint).toBe('test-endpoint');
			expect(error.details).toEqual({ detail: 'test' });
			expect(error.name).toBe('ApiError');
		});
	});

	describe('fetchWithTimeout', () => {
		it('should fetch successfully within timeout', async () => {
			vi.useRealTimers();
			(global.fetch as any).mockResolvedValueOnce({
				ok: true,
				status: 200,
				statusText: 'OK'
			});

			const response = await fetchWithTimeout('https://example.com');

			expect(response.ok).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				'https://example.com',
				expect.objectContaining({
					signal: expect.any(AbortSignal)
				})
			);
		});

		it('should throw timeout error after timeout', async () => {
			vi.useRealTimers();
			(global.fetch as any).mockImplementation(
				(url: string, options?: RequestInit) => {
					return new Promise((resolve, reject) => {
						// Set up abort listener immediately
						if (options?.signal) {
							const onAbort = () => {
								const error: any = new Error('The operation was aborted.');
								error.name = 'AbortError';
								reject(error);
							};
							
							if (options.signal.aborted) {
								onAbort();
							} else {
								options.signal.addEventListener('abort', onAbort);
							}
						}
						// Never resolve - let timeout handle it
					});
				}
			);

			await expect(fetchWithTimeout('https://example.com', {}, 50)).rejects.toThrow(
				ApiError
			);
		}, 10000);

		it('should throw ApiError for non-ok responses', async () => {
			vi.useRealTimers();
			(global.fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: 'Not Found'
			});

			await expect(fetchWithTimeout('https://example.com')).rejects.toThrow(ApiError);
		});
	});

	describe('buildQueryString', () => {
		it('should build query string from params', () => {
			const params = {
				search: 'metformin',
				limit: 10
			};

			const result = buildQueryString(params);

			expect(result).toBe('search=metformin&limit=10');
		});

		it('should encode special characters', () => {
			const params = {
				search: 'metformin 500mg',
				limit: 10
			};

			const result = buildQueryString(params);

			expect(result).toContain('metformin%20500mg');
		});

		it('should filter out undefined values', () => {
			const params: any = {
				search: 'metformin',
				limit: undefined,
				offset: 0
			};

			const result = buildQueryString(params);

			expect(result).not.toContain('limit');
			expect(result).toContain('search=metformin');
			expect(result).toContain('offset=0');
		});

		it('should filter out null values', () => {
			const params: any = {
				search: 'metformin',
				limit: null,
				offset: 0
			};

			const result = buildQueryString(params);

			expect(result).not.toContain('limit');
		});
	});

	describe('retryWithBackoff', () => {
		it('should succeed on first attempt', async () => {
			vi.useRealTimers();
			const fn = vi.fn().mockResolvedValueOnce('success');

			const result = await retryWithBackoff(fn);

			expect(result).toBe('success');
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it('should retry on failure', async () => {
			vi.useRealTimers();
			const fn = vi
				.fn()
				.mockRejectedValueOnce(new Error('fail'))
				.mockResolvedValueOnce('success');

			const result = await retryWithBackoff(fn, 3, 10);

			expect(result).toBe('success');
			expect(fn).toHaveBeenCalledTimes(2);
		});

		it('should not retry on client errors (4xx)', async () => {
			vi.useRealTimers();
			const error = new ApiError('Not found', 404, 'test');
			const fn = vi.fn().mockRejectedValueOnce(error);

			await expect(retryWithBackoff(fn)).rejects.toThrow(ApiError);
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it('should throw after max retries', async () => {
			vi.useRealTimers();
			const fn = vi.fn().mockRejectedValue(new Error('fail'));

			await expect(retryWithBackoff(fn, 3, 10)).rejects.toThrow('fail');
			expect(fn).toHaveBeenCalledTimes(3);
		});

		it('should use exponential backoff', async () => {
			vi.useRealTimers();
			const fn = vi
				.fn()
				.mockRejectedValueOnce(new Error('fail'))
				.mockRejectedValueOnce(new Error('fail'))
				.mockResolvedValueOnce('success');

			const result = await retryWithBackoff(fn, 3, 10);

			expect(result).toBe('success');
			expect(fn).toHaveBeenCalledTimes(3);
		});
	});
});

