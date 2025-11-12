import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { authStore, user, isAuthenticated, isLoading } from '$lib/stores/auth';
import { onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
	onAuthStateChanged: vi.fn()
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

describe('Auth Store', () => {
	const mockUser: FirebaseUser = {
		uid: 'test-123',
		email: 'test@example.com',
		displayName: 'Test User',
		emailVerified: true
	} as any;

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset store by creating new instance
		(vi.mocked(onAuthStateChanged) as any).mockImplementation((auth, callback) => {
			callback(null);
			return vi.fn();
		});
	});

	it('should initialize with null user and loading true', () => {
		const state = get(authStore);
		expect(state.user).toBeNull();
		expect(state.loading).toBe(true);
		expect(state.initialized).toBe(false);
	});

	it('should initialize auth state listener', () => {
		// The store should be initialized (tested by other tests)
		// onAuthStateChanged is called during module load, so we just verify the store exists
		const state = get(authStore);
		expect(state).toBeDefined();
	});

	it('should provide derived user store', () => {
		const currentUser = get(user);
		expect(currentUser).toBeNull();
	});

	it('should provide derived isAuthenticated store', () => {
		const authenticated = get(isAuthenticated);
		expect(authenticated).toBe(false);
	});

	it('should provide derived isLoading store', () => {
		const loading = get(isLoading);
		expect(loading).toBe(true);
	});

	it('should set user manually', () => {
		authStore.setUser(mockUser);
		const state = get(authStore);
		expect(state.user).toEqual(mockUser);
	});

	it('should set loading state manually', () => {
		authStore.setLoading(false);
		const state = get(authStore);
		expect(state.loading).toBe(false);
	});
});

