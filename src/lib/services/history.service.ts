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
	Timestamp,
	type QueryConstraint
} from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { CalculationResult } from '$lib/types/calculation';

export interface SavedCalculation {
	id: string;
	userId: string;
	calculation: CalculationResult;
	notes?: string;
	tags?: string[];
	isFavorite: boolean;
	createdAt: Date;
	updatedAt: Date;
}

class HistoryService {
	private readonly COLLECTION = 'calculations';
	private readonly MAX_HISTORY = 100; // Per user

	/**
	 * Remove undefined values from object (Firestore doesn't accept undefined)
	 */
	private removeUndefined(obj: any): any {
		if (obj === null || obj === undefined) {
			return null;
		}
		if (Array.isArray(obj)) {
			return obj.map((item) => this.removeUndefined(item));
		}
		if (typeof obj === 'object' && obj.constructor === Object) {
			const cleaned: any = {};
			for (const key in obj) {
				if (obj[key] !== undefined) {
					cleaned[key] = this.removeUndefined(obj[key]);
				}
			}
			return cleaned;
		}
		return obj;
	}

	/**
	 * Safely convert Date to Timestamp, handling invalid dates
	 */
	private safeDateToTimestamp(date: Date | null | undefined): Timestamp {
		if (!date) {
			return Timestamp.now();
		}
		// Check if date is valid
		if (isNaN(date.getTime())) {
			console.warn('Invalid date detected, using current time:', date);
			return Timestamp.now();
		}
		return Timestamp.fromDate(date);
	}

	/**
	 * Recursively validate and fix Date objects in calculation data
	 * Converts invalid dates to valid ones, but keeps Date objects (Firestore handles them)
	 */
	private cleanCalculationDates(obj: any): any {
		if (obj === null || obj === undefined) {
			return null;
		}
		if (obj instanceof Date) {
			// Validate date - if invalid, replace with current time
			if (isNaN(obj.getTime())) {
				console.warn('Invalid date in calculation, replacing with current time:', obj);
				return new Date();
			}
			return obj;
		}
		if (Array.isArray(obj)) {
			return obj.map((item) => this.cleanCalculationDates(item));
		}
		if (typeof obj === 'object' && obj.constructor === Object) {
			const cleaned: any = {};
			for (const key in obj) {
				cleaned[key] = this.cleanCalculationDates(obj[key]);
			}
			return cleaned;
		}
		return obj;
	}

	/**
	 * Save calculation to history
	 */
	async saveCalculation(
		userId: string,
		calculation: CalculationResult,
		notes?: string,
		tags?: string[]
	): Promise<string> {
		try {
			// Clean all Date objects in calculation recursively (validate them)
			const cleanedCalculation = this.cleanCalculationDates(calculation);

			// Ensure calculation.timestamp is a valid Date
			if (!cleanedCalculation.timestamp || !(cleanedCalculation.timestamp instanceof Date)) {
				cleanedCalculation.timestamp = new Date();
			}

			const saved: any = {
				userId,
				calculation: cleanedCalculation,
				tags: tags || [],
				isFavorite: false,
				createdAt: new Date(),
				updatedAt: new Date()
			};

			// Only include notes if provided
			if (notes) {
				saved.notes = notes;
			}

			// Convert calculation timestamp to Firestore Timestamp
			const calcTimestamp = this.safeDateToTimestamp(cleanedCalculation.timestamp);
			
			const firestoreData = {
				...saved,
				calculation: {
					...saved.calculation,
					timestamp: calcTimestamp
				},
				createdAt: this.safeDateToTimestamp(saved.createdAt),
				updatedAt: this.safeDateToTimestamp(saved.updatedAt)
			};

			// Remove undefined values before saving
			const cleanedData = this.removeUndefined(firestoreData);

			const docRef = await addDoc(collection(db, this.COLLECTION), cleanedData);

			return docRef.id;
		} catch (error) {
			console.error('Error saving calculation:', error);
			throw new Error('Failed to save calculation to history');
		}
	}

	/**
	 * Get single calculation by ID
	 */
	async getCalculation(id: string, userId: string): Promise<SavedCalculation | null> {
		try {
			const docRef = doc(db, this.COLLECTION, id);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				return null;
			}

			const data = docSnap.data();

			// Verify ownership
			if (data.userId !== userId) {
				throw new Error('Unauthorized access to calculation');
			}

			return this.transformFirestoreDoc(id, data);
		} catch (error) {
			console.error('Error fetching calculation:', error);
			throw error;
		}
	}

	/**
	 * Get user's calculation history
	 */
	async getUserHistory(
		userId: string,
		options: {
			limitCount?: number;
			favoritesOnly?: boolean;
			searchQuery?: string;
			startDate?: Date;
			endDate?: Date;
		} = {}
	): Promise<SavedCalculation[]> {
		try {
			const constraints: QueryConstraint[] = [
				where('userId', '==', userId),
				orderBy('createdAt', 'desc')
			];

			if (options.favoritesOnly) {
				constraints.push(where('isFavorite', '==', true));
			}

			if (options.startDate) {
				constraints.push(where('createdAt', '>=', Timestamp.fromDate(options.startDate)));
			}

			if (options.endDate) {
				constraints.push(where('createdAt', '<=', Timestamp.fromDate(options.endDate)));
			}

			if (options.limitCount) {
				constraints.push(limit(options.limitCount));
			} else {
				constraints.push(limit(this.MAX_HISTORY));
			}

			const q = query(collection(db, this.COLLECTION), ...constraints);
			const querySnapshot = await getDocs(q);

			let results = querySnapshot.docs.map((doc) =>
				this.transformFirestoreDoc(doc.id, doc.data())
			);

			// Client-side search filter (Firestore doesn't support text search)
			if (options.searchQuery) {
				const searchLower = options.searchQuery.toLowerCase();
				results = results.filter(
					(calc) =>
						calc.calculation.input.drugName.toLowerCase().includes(searchLower) ||
						calc.calculation.input.instructions.toLowerCase().includes(searchLower) ||
						calc.notes?.toLowerCase().includes(searchLower) ||
						calc.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
				);
			}

			return results;
		} catch (error: any) {
			console.error('Error fetching history:', error);
			// Check if it's an index building error
			if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
				throw new Error(
					'History index is still building. Please wait a few minutes and refresh the page.'
				);
			}
			throw new Error('Failed to load calculation history');
		}
	}

	/**
	 * Update calculation notes
	 */
	async updateNotes(id: string, userId: string, notes: string): Promise<void> {
		try {
			const docRef = doc(db, this.COLLECTION, id);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists() || docSnap.data().userId !== userId) {
				throw new Error('Calculation not found or unauthorized');
			}

			await updateDoc(docRef, {
				notes,
				updatedAt: Timestamp.now()
			});
		} catch (error) {
			console.error('Error updating notes:', error);
			throw error;
		}
	}

	/**
	 * Toggle favorite status
	 */
	async toggleFavorite(id: string, userId: string): Promise<boolean> {
		try {
			const docRef = doc(db, this.COLLECTION, id);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists() || docSnap.data().userId !== userId) {
				throw new Error('Calculation not found or unauthorized');
			}

			const currentStatus = docSnap.data().isFavorite || false;
			const newStatus = !currentStatus;

			await updateDoc(docRef, {
				isFavorite: newStatus,
				updatedAt: Timestamp.now()
			});

			return newStatus;
		} catch (error) {
			console.error('Error toggling favorite:', error);
			throw error;
		}
	}

	/**
	 * Delete calculation
	 */
	async deleteCalculation(id: string, userId: string): Promise<void> {
		try {
			const docRef = doc(db, this.COLLECTION, id);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists() || docSnap.data().userId !== userId) {
				throw new Error('Calculation not found or unauthorized');
			}

			await deleteDoc(docRef);
		} catch (error) {
			console.error('Error deleting calculation:', error);
			throw error;
		}
	}

	/**
	 * Transform Firestore document to SavedCalculation
	 */
	private transformFirestoreDoc(id: string, data: any): SavedCalculation {
		return {
			id,
			userId: data.userId,
			calculation: {
				...data.calculation,
				timestamp: data.calculation.timestamp?.toDate() || new Date()
			},
			notes: data.notes,
			tags: data.tags || [],
			isFavorite: data.isFavorite || false,
			createdAt: data.createdAt?.toDate() || new Date(),
			updatedAt: data.updatedAt?.toDate() || new Date()
		};
	}
}

export const historyService = new HistoryService();

