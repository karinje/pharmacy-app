import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('$lib/config/firebase', () => ({
	auth: {
		currentUser: null,
		onAuthStateChanged: vi.fn((callback) => {
			callback(null);
			return vi.fn(); // Return unsubscribe function
		})
	},
	db: {},
	functions: {}
}));

// Mock environment
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	building: false,
	version: '1.0.0'
}));

// Mock navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	prefetch: vi.fn(),
	prefetchRoutes: vi.fn()
}));

// Mock Firebase Functions
vi.mock('firebase/functions', () => ({
	httpsCallable: vi.fn(() => vi.fn()),
	getFunctions: vi.fn(),
	connectFunctionsEmulator: vi.fn()
}));

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
	collection: vi.fn(),
	doc: vi.fn(),
	addDoc: vi.fn(),
	getDoc: vi.fn(),
	getDocs: vi.fn(),
	updateDoc: vi.fn(),
	deleteDoc: vi.fn(),
	query: vi.fn(),
	where: vi.fn(),
	orderBy: vi.fn(),
	limit: vi.fn(),
	Timestamp: {
		now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
		fromDate: vi.fn((date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }))
	}
}));

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
	onAuthStateChanged: vi.fn((auth, callback) => {
		callback(null);
		return vi.fn();
	}),
	signInWithEmailAndPassword: vi.fn(),
	createUserWithEmailAndPassword: vi.fn(),
	signOut: vi.fn(),
	sendPasswordResetEmail: vi.fn()
}));

