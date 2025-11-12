import { describe, it, expect, vi, beforeEach } from 'vitest';
import { historyService } from '$lib/services/history.service';
import {
	collection,
	doc,
	addDoc,
	getDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit,
	Timestamp
} from 'firebase/firestore';
import { mockFirestoreDoc, mockFirestoreQuerySnapshot } from '../mocks/firebase.mock';

// Mock Firestore
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

vi.mock('$lib/config/firebase', () => ({
	db: {}
}));

describe('History Management Integration', () => {
	const mockUserId = 'test-user-123';
	const mockCalculationResult = {
		id: 'calc-123',
		input: {
			drugName: 'Metformin',
			instructions: 'Take 1 tablet twice daily',
			daysSupply: 30
		},
		rxnormData: {
			rxcui: '860975',
			name: 'Metformin 500 MG',
			confidence: 'high' as const
		},
		allProducts: [],
		activeProducts: [],
		inactiveProducts: [],
		parsing: {
			dosage: { amount: 1, unit: 'tablet' },
			frequency: { timesPerDay: 2 },
			route: 'oral',
			confidence: 'high' as const,
			warnings: []
		},
		quantity: {
			dailyQuantity: 2,
			totalQuantityNeeded: 60,
			calculation: 'Test',
			assumptions: [],
			uncertainties: []
		},
		optimization: {
			recommendedPackages: [],
			alternatives: [],
			rationale: 'Test'
		},
		explanation: 'Test explanation',
		warnings: [],
		timestamp: new Date()
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should save calculation to history', async () => {
		const mockDocRef = { id: 'saved-123' };
		(vi.mocked(addDoc) as any).mockResolvedValueOnce(mockDocRef);

		const id = await historyService.saveCalculation(mockUserId, mockCalculationResult, 'Test notes');

		expect(id).toBe('saved-123');
		expect(addDoc).toHaveBeenCalled();
	});

	it('should get calculation by ID', async () => {
		const mockTimestamp = {
			toDate: () => new Date(),
			seconds: Math.floor(Date.now() / 1000),
			nanoseconds: 0
		};
		
		const mockDocData = {
			userId: mockUserId,
			calculation: {
				...mockCalculationResult,
				timestamp: mockTimestamp
			},
			notes: 'Test notes',
			tags: [],
			isFavorite: false,
			createdAt: mockTimestamp,
			updatedAt: mockTimestamp
		};

		(vi.mocked(getDoc) as any).mockResolvedValueOnce(
			mockFirestoreDoc('calc-123', mockDocData)
		);

		const result = await historyService.getCalculation('calc-123', mockUserId);

		expect(result).not.toBeNull();
		expect(result?.id).toBe('calc-123');
		expect(result?.userId).toBe(mockUserId);
	});

	it('should get user history with filters', async () => {
		const mockTimestamp = {
			toDate: () => new Date(),
			seconds: Math.floor(Date.now() / 1000),
			nanoseconds: 0
		};
		
		const mockDocs = [
			mockFirestoreDoc('calc-1', {
				userId: mockUserId,
				calculation: {
					...mockCalculationResult,
					timestamp: mockTimestamp
				},
				notes: 'Test',
				tags: [],
				isFavorite: false,
				createdAt: mockTimestamp,
				updatedAt: mockTimestamp
			})
		];

		(vi.mocked(getDocs) as any).mockResolvedValueOnce(mockFirestoreQuerySnapshot(mockDocs));

		const history = await historyService.getUserHistory(mockUserId, {
			limitCount: 10,
			favoritesOnly: false,
			searchQuery: 'Metformin'
		});

		expect(history).toHaveLength(1);
		expect(getDocs).toHaveBeenCalled();
	});

	it('should update calculation notes', async () => {
		const mockDocData = {
			userId: mockUserId,
			calculation: mockCalculationResult
		};

		(vi.mocked(getDoc) as any).mockResolvedValueOnce(
			mockFirestoreDoc('calc-123', mockDocData)
		);
		(vi.mocked(updateDoc) as any).mockResolvedValueOnce(undefined);

		await historyService.updateNotes('calc-123', mockUserId, 'Updated notes');

		expect(updateDoc).toHaveBeenCalled();
	});

	it('should toggle favorite status', async () => {
		const mockDocData = {
			userId: mockUserId,
			calculation: mockCalculationResult,
			isFavorite: false
		};

		(vi.mocked(getDoc) as any).mockResolvedValueOnce(
			mockFirestoreDoc('calc-123', mockDocData)
		);
		(vi.mocked(updateDoc) as any).mockResolvedValueOnce(undefined);

		const newStatus = await historyService.toggleFavorite('calc-123', mockUserId);

		expect(newStatus).toBe(true);
		expect(updateDoc).toHaveBeenCalled();
	});

	it('should delete calculation', async () => {
		const mockDocData = {
			userId: mockUserId,
			calculation: mockCalculationResult
		};

		(vi.mocked(getDoc) as any).mockResolvedValueOnce(
			mockFirestoreDoc('calc-123', mockDocData)
		);
		(vi.mocked(deleteDoc) as any).mockResolvedValueOnce(undefined);

		await historyService.deleteCalculation('calc-123', mockUserId);

		expect(deleteDoc).toHaveBeenCalled();
	});

	it('should handle unauthorized access', async () => {
		const mockDocData = {
			userId: 'different-user',
			calculation: mockCalculationResult
		};

		(vi.mocked(getDoc) as any).mockResolvedValueOnce(
			mockFirestoreDoc('calc-123', mockDocData)
		);

		await expect(
			historyService.getCalculation('calc-123', mockUserId)
		).rejects.toThrow('Unauthorized');
	});
});

