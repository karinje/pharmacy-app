export const mockFirebaseUser = {
	uid: 'test-user-123',
	email: 'test@example.com',
	displayName: 'Test User',
	emailVerified: true
};

export const mockFirestoreDoc = (id: string, data: any) => ({
	id,
	exists: () => true,
	data: () => data,
	ref: { id }
});

export const mockFirestoreQuerySnapshot = (docs: any[]) => ({
	docs,
	empty: docs.length === 0,
	size: docs.length,
	forEach: (callback: (doc: any) => void) => docs.forEach(callback)
});

