export const mockFetch = (response: any, ok: boolean = true) => {
	return vi.fn(() =>
		Promise.resolve({
			ok,
			json: async () => response,
			status: ok ? 200 : 404,
			statusText: ok ? 'OK' : 'Not Found'
		})
	);
};

export const mockApiError = (message: string, status: number = 500) => {
	return {
		message,
		status,
		name: 'ApiError',
		endpoint: 'test'
	};
};

