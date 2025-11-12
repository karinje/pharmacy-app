import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (only once)
if (admin.apps.length === 0) {
	admin.initializeApp();
}

interface NormalizeRequest {
	drugName: string;
}

interface NormalizeResponse {
	rxcui: string;
	name: string;
	confidence: 'high' | 'medium' | 'low';
	alternatives: Array<{
		rxcui: string;
		name: string;
		score: string;
	}>;
}

/**
 * Cloud Function to normalize drug names using RxNorm API
 * This runs server-side to avoid CORS issues and for better caching
 */
export const normalizeDrugName = functions
	.region('us-central1')
	.runWith({
		timeoutSeconds: 30,
		memory: '256MB'
	})
	.https.onCall(async (data: NormalizeRequest, context) => {
		// Verify authentication
		if (!context.auth) {
			throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
		}

		const { drugName } = data;

		if (!drugName || drugName.trim().length < 2) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Drug name must be at least 2 characters'
			);
		}

		try {
			// Check Firestore cache first
			const cacheRef = admin
				.firestore()
				.collection('cache')
				.doc(`rxnorm_${drugName.toLowerCase()}`);

			const cacheDoc = await cacheRef.get();

			if (cacheDoc.exists) {
				const cached = cacheDoc.data();
				// Check if cache is still valid (7 days)
				if (cached && cached.expiresAt > Date.now()) {
					return cached.data;
				}
			}

			// Call RxNorm API
			const url = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(drugName)}&maxEntries=10`;

			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`RxNorm API error: ${response.status}`);
			}

			const rxnormData = await response.json();

			if (
				!rxnormData.approximateGroup?.candidate ||
				rxnormData.approximateGroup.candidate.length === 0
			) {
				throw new functions.https.HttpsError('not-found', 'No matching drug found');
			}

			const bestMatch = rxnormData.approximateGroup.candidate[0];
			const score = parseInt(bestMatch.score);

			const result: NormalizeResponse = {
				rxcui: bestMatch.rxcui || '',
				name: bestMatch.name || '',
				confidence: score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low',
				alternatives: rxnormData.approximateGroup.candidate
					.slice(1, 5)
					.filter((c: any) => c && c.rxcui && c.name && c.score)
					.map((c: any) => ({
						rxcui: c.rxcui || '',
						name: c.name || '',
						score: c.score || '0'
					}))
			};

			// Cache the result for 7 days (remove undefined values)
			const cacheData: any = {
				data: {
					rxcui: result.rxcui,
					name: result.name,
					confidence: result.confidence,
					alternatives: result.alternatives.filter((alt) => alt.rxcui && alt.name && alt.score)
				},
				expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
				createdAt: admin.firestore.FieldValue.serverTimestamp()
			};
			await cacheRef.set(cacheData);

			return result;
		} catch (error) {
			console.error('Error normalizing drug name:', error);
			throw new functions.https.HttpsError('internal', 'Failed to normalize drug name');
		}
	}
);

interface SearchDrugsRequest {
	term: string;
	maxResults?: number;
}

interface SearchDrugsResponse {
	candidates: Array<{
		rxcui: string;
		name: string;
		score: string;
		rank: string;
	}>;
	source?: string;
}

/**
 * Cloud Function to search drugs by name (for autocomplete)
 */
export const searchDrugs = functions
	.region('us-central1')
	.runWith({
		timeoutSeconds: 30,
		memory: '256MB'
	})
	.https.onCall(async (data: SearchDrugsRequest, context) => {
		// Verify authentication
		if (!context.auth) {
			throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
		}

		const { term, maxResults = 10 } = data;

		if (!term || term.trim().length < 2) {
			return { candidates: [] };
		}

		try {
			console.log('searchDrugs called with:', { term, maxResults });
			
			// Check Firestore cache first
			const cacheKey = `rxnorm_search_${term.toLowerCase()}_${maxResults}`;
			const cacheRef = admin.firestore().collection('cache').doc(cacheKey);

			const cacheDoc = await cacheRef.get();

			if (cacheDoc.exists) {
				const cached = cacheDoc.data();
				// Check if cache is still valid (1 hour)
				if (cached && cached.expiresAt > Date.now()) {
					console.log('Cache hit for:', term, '- returning cached results (may be from old endpoint)');
					return cached.data;
				} else {
					console.log('Cache expired for:', term, '- will fetch fresh from CTSS');
				}
			}

			// Use CTSS RxTerms - purpose-built autocomplete endpoint
			// Returns clean display names + RxCUI in one call
			let candidates: any[] = [];
			let source = 'none';
			
			try {
				const ctssUrl = new URL('https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search');
				ctssUrl.searchParams.set('terms', term);
				ctssUrl.searchParams.set('maxList', maxResults.toString());
				ctssUrl.searchParams.set('ef', 'STRENGTHS_AND_FORMS,RXCUIS,SXDG_RXCUI');
				
				console.log('Calling CTSS RxTerms endpoint:', ctssUrl.toString());
				
				const ctssResponse = await fetch(ctssUrl.toString(), {
					signal: AbortSignal.timeout(20000)
				});

				if (ctssResponse.ok) {
					const ctssData = await ctssResponse.json();
					console.log('CTSS raw response:', JSON.stringify(ctssData).substring(0, 500));
					
					// CTSS returns: [totalCount, codes, {extras...}, displayStrings, codeSystems]
					// displayStrings is an array of arrays: [["ADVIL (Oral Liquid)"], ["ADVIL (Oral Pill)"]]
					const [totalCount, , extras, displayStrings] = ctssData;
					
					console.log('✅ CTSS RxTerms SUCCESS:', {
						totalCount,
						displayCount: displayStrings?.length || 0,
						firstFew: displayStrings?.slice(0, 3),
						hasExtras: !!extras,
						hasRXCUIS: !!extras?.RXCUIS
					});
					
					if (displayStrings && displayStrings.length > 0) {
						source = 'ctss';
						// Map CTSS response to our format
						// displayStrings is array of arrays, so we need to get the first element
						candidates = displayStrings.map((displayArray: any, index: number) => {
							// displayArray is like ["ADVIL (Oral Liquid)"] - get first element
							const display = Array.isArray(displayArray) ? displayArray[0] : displayArray;
							
							// Get RxCUI - prefer SXDG_RXCUI (base concept) or first from RXCUIS array
							const rxcuis = extras?.RXCUIS?.[index] || [];
							const sxdgRxcui = extras?.SXDG_RXCUI?.[index];
							const rxcui = sxdgRxcui || rxcuis[0] || '';
							
							// Clean up display name - remove extra info in parentheses if too verbose
							let cleanName = typeof display === 'string' ? display : String(display);
							
							return {
								rxcui: rxcui,
								name: cleanName,
								score: '100', // CTSS returns exact/close matches
								rank: (index + 1).toString()
							};
						});
					} else {
						console.log('⚠️ CTSS returned 0 display strings');
					}
				} else {
					console.log('❌ CTSS response not OK:', ctssResponse.status, ctssResponse.statusText);
				}
			} catch (err: any) {
				console.log('❌ CTSS endpoint failed, trying approximateTerm fallback:', err.message || err);
			}
			
			// Fallback: approximateTerm endpoint (for fuzzy matching if CTSS fails)
			if (candidates.length === 0) {
				source = 'approximateTerm';
				const url = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=${maxResults}`;
				console.log('⚠️ CTSS returned 0 results, trying RxNorm approximateTerm (fallback):', url);

				const response = await fetch(url, {
					signal: AbortSignal.timeout(20000)
				});

				if (response.ok) {
					const rxnormData = await response.json();
					console.log('RxNorm approximateTerm response:', {
						hasCandidates: !!rxnormData.approximateGroup?.candidate,
						candidateCount: rxnormData.approximateGroup?.candidate?.length || 0
					});
					
					candidates = rxnormData.approximateGroup?.candidate || [];
				} else {
					console.log('❌ approximateTerm response not OK:', response.status);
				}
			}
			
			// Remove duplicates and limit to maxResults
			const seen = new Set<string>();
			candidates = candidates
				.filter(c => {
					const key = c.name.toLowerCase();
					if (seen.has(key)) return false;
					seen.add(key);
					return true;
				})
				.slice(0, maxResults);

			const result: SearchDrugsResponse = {
				candidates: candidates.map((c: any) => ({
					rxcui: c.rxcui,
					name: c.name,
					score: c.score,
					rank: c.rank
				})),
				source: source // Track which API was actually used
			};

			// Cache for 1 hour
			await cacheRef.set({
				data: result,
				expiresAt: Date.now() + 60 * 60 * 1000,
				createdAt: admin.firestore.FieldValue.serverTimestamp()
			});

			console.log('Returning', result.candidates.length, 'candidates');
			return result;
		} catch (error: any) {
			console.error('Error searching drugs:', {
				term,
				error: error.message,
				stack: error.stack,
				name: error.name
			});
			// Return empty results instead of throwing for search
			return { candidates: [] };
		}
	});

