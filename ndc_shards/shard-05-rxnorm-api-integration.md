# SHARD 5: RxNorm API Integration

## Status: ✅ COMPLETE

## Objective
Integrate RxNorm API for drug name normalization and RxCUI lookup, with caching and error handling.

## Dependencies
- ✅ Shard 1 (Project Foundation) - COMPLETE
- ✅ Shard 2 (Authentication) - COMPLETE
- ✅ Shard 3 (UI Components) - COMPLETE
- ✅ Shard 4 (Calculator Form UI) - COMPLETE

## Context from Shard 4

**Completed Calculator Form:**
- `DrugSearchInput.svelte` - Drug name input with autocomplete (currently static list)
- `InstructionsInput.svelte` - Instructions textarea with medical abbreviation detection
- `DaysSupplyInput.svelte` - Days supply input with quick select buttons
- `CalculatorForm.svelte` - Main form component with validation
- Calculator page at `/calculator` route

**Form State Management:**
- `calculator.ts` store with methods: setInput, setCalculating, setResult, setError, reset
- Form validation with Zod schemas
- Loading and error states implemented

**What to Integrate:**
- Replace static drug suggestions with live RxNorm API calls
- Add drug name normalization before calculation
- Implement RxCUI lookup for accurate drug identification
- Add caching to reduce API calls and improve performance

**Available Form Data:**
```typescript
interface CalculatorFormData {
  drugName: string;      // e.g., "Metformin 500mg"
  instructions: string;  // e.g., "Take 1 tablet BID"
  daysSupply: number;    // e.g., 30
}
```

**Next Steps:**
- Integrate RxNorm API when user types in drug name field
- Show real drug suggestions from RxNorm
- Normalize drug name before sending to calculation
- Store RxCUI for use in NDC lookup (Shard 6)

## Files to Create/Modify

```
src/
├── lib/
│   ├── services/
│   │   ├── rxnorm.service.ts            # NEW: RxNorm API client
│   │   └── cache.service.ts             # NEW: Generic caching service
│   ├── types/
│   │   └── rxnorm.ts                    # NEW: RxNorm response types
│   └── utils/
│       └── api-helpers.ts               # NEW: HTTP helpers
└── functions/
    └── src/
        └── rxnorm/
            ├── normalize.ts             # NEW: Cloud Function for RxNorm
            └── index.ts                 # NEW: Function exports
```

## Implementation Details

### 1. RxNorm Types (`src/lib/types/rxnorm.ts`)
```typescript
export interface RxNormResponse {
  idGroup?: {
    name?: string;
    rxnormId?: string[];
  };
  approximateGroup?: {
    candidate?: RxNormCandidate[];
  };
}

export interface RxNormCandidate {
  rxcui: string;
  name: string;
  score: string;
  rank: string;
}

export interface RxNormConcept {
  rxcui: string;
  name: string;
  synonym?: string;
  tty?: string; // Term Type (SCD, SBD, GPCK, etc.)
  language?: string;
  suppress?: string;
  umlscui?: string;
}

export interface RxNormNDC {
  ndcItem?: {
    packaged?: string;
    ndcCode?: string;
    ndc11?: string;
  };
  conceptProperties?: {
    rxcui?: string;
    name?: string;
    synonym?: string;
    tty?: string;
    language?: string;
  };
}

export interface NormalizedDrug {
  rxcui: string;
  name: string;
  originalInput: string;
  confidence: 'high' | 'medium' | 'low';
  alternatives: RxNormCandidate[];
}
```

### 2. API Helpers (`src/lib/utils/api-helpers.ts`)
```typescript
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
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        url
      );
    }

    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
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
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}
```

### 3. Cache Service (`src/lib/services/cache.service.ts`)
```typescript
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
```

### 4. RxNorm Service (`src/lib/services/rxnorm.service.ts`)
```typescript
import { env } from '$lib/config/env';
import { CACHE_DURATION } from '$lib/config/constants';
import { cacheService } from './cache.service';
import { fetchWithTimeout, retryWithBackoff, buildQueryString, ApiError } from '$lib/utils/api-helpers';
import type { RxNormResponse, RxNormConcept, NormalizedDrug, RxNormCandidate } from '$lib/types/rxnorm';

class RxNormService {
  private baseUrl = env.rxnorm.baseUrl;

  /**
   * Normalize drug name to RxNorm concept
   */
  async normalizeDrugName(drugName: string): Promise<NormalizedDrug> {
    const cacheKey = `rxnorm:normalize:${drugName.toLowerCase()}`;
    
    // Check cache first
    const cached = cacheService.get<NormalizedDrug>(cacheKey);
    if (cached) return cached;

    try {
      // Try approximate match first (handles misspellings, variations)
      const response = await retryWithBackoff(async () => {
        const url = `${this.baseUrl}/approximateTerm.json?term=${encodeURIComponent(drugName)}&maxEntries=10`;
        return fetchWithTimeout(url);
      });

      const data: RxNormResponse = await response.json();

      if (!data.approximateGroup?.candidate || data.approximateGroup.candidate.length === 0) {
        throw new ApiError('No matching drug found', 404, 'RxNorm');
      }

      // Get the best match
      const bestMatch = data.approximateGroup.candidate[0];
      const alternatives = data.approximateGroup.candidate.slice(1, 5);

      // Determine confidence based on score
      const score = parseInt(bestMatch.score);
      const confidence: 'high' | 'medium' | 'low' = 
        score >= 90 ? 'high' :
        score >= 70 ? 'medium' : 'low';

      const normalized: NormalizedDrug = {
        rxcui: bestMatch.rxcui,
        name: bestMatch.name,
        originalInput: drugName,
        confidence,
        alternatives
      };

      // Cache for 7 days
      cacheService.set(cacheKey, normalized, CACHE_DURATION.RXNORM);

      return normalized;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Failed to normalize drug name',
        500,
        'RxNorm',
        error
      );
    }
  }

  /**
   * Get RxNorm concept details
   */
  async getConceptDetails(rxcui: string): Promise<RxNormConcept> {
    const cacheKey = `rxnorm:concept:${rxcui}`;
    
    const cached = cacheService.get<RxNormConcept>(cacheKey);
    if (cached) return cached;

    try {
      const response = await retryWithBackoff(async () => {
        const url = `${this.baseUrl}/rxcui/${rxcui}/properties.json`;
        return fetchWithTimeout(url);
      });

      const data = await response.json();

      if (!data.properties) {
        throw new ApiError('Concept not found', 404, 'RxNorm');
      }

      const concept: RxNormConcept = {
        rxcui: data.properties.rxcui,
        name: data.properties.name,
        synonym: data.properties.synonym,
        tty: data.properties.tty,
        language: data.properties.language,
        suppress: data.properties.suppress,
        umlscui: data.properties.umlscui
      };

      cacheService.set(cacheKey, concept, CACHE_DURATION.RXNORM);

      return concept;
    } catch (error) {
      throw new ApiError(
        'Failed to get concept details',
        500,
        'RxNorm',
        error
      );
    }
  }

  /**
   * Get NDCs for a given RxCUI
   */
  async getNDCsForRxCUI(rxcui: string): Promise<string[]> {
    const cacheKey = `rxnorm:ndcs:${rxcui}`;
    
    const cached = cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await retryWithBackoff(async () => {
        const url = `${this.baseUrl}/rxcui/${rxcui}/ndcs.json`;
        return fetchWithTimeout(url);
      });

      const data = await response.json();

      const ndcs = data.ndcGroup?.ndcList?.ndc || [];

      // Cache for 24 hours (NDCs can change)
      cacheService.set(cacheKey, ndcs, CACHE_DURATION.FDA_NDC);

      return ndcs;
    } catch (error) {
      throw new ApiError(
        'Failed to get NDCs',
        500,
        'RxNorm',
        error
      );
    }
  }

  /**
   * Search drugs by name (for autocomplete)
   */
  async searchDrugs(term: string, maxResults: number = 10): Promise<RxNormCandidate[]> {
    if (term.length < 2) return [];

    const cacheKey = `rxnorm:search:${term.toLowerCase()}:${maxResults}`;
    
    const cached = cacheService.get<RxNormCandidate[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/approximateTerm.json?term=${encodeURIComponent(term)}&maxEntries=${maxResults}`
      );

      const data: RxNormResponse = await response.json();
      const results = data.approximateGroup?.candidate || [];

      // Cache for 1 hour
      cacheService.set(cacheKey, results, 60 * 60 * 1000);

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Clear RxNorm cache
   */
  clearCache(): void {
    cacheService.clear();
  }
}

export const rxnormService = new RxNormService();
```

### 5. Cloud Function for RxNorm (`functions/src/rxnorm/normalize.ts`)
```typescript
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
export const normalizeDrugName = functions.https.onCall(
  async (data: NormalizeRequest, context) => {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
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
      const cacheRef = admin.firestore()
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

      if (!rxnormData.approximateGroup?.candidate || rxnormData.approximateGroup.candidate.length === 0) {
        throw new functions.https.HttpsError(
          'not-found',
          'No matching drug found'
        );
      }

      const bestMatch = rxnormData.approximateGroup.candidate[0];
      const score = parseInt(bestMatch.score);
      
      const result: NormalizeResponse = {
        rxcui: bestMatch.rxcui,
        name: bestMatch.name,
        confidence: score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low',
        alternatives: rxnormData.approximateGroup.candidate.slice(1, 5).map((c: any) => ({
          rxcui: c.rxcui,
          name: c.name,
          score: c.score
        }))
      };

      // Cache the result for 7 days
      await cacheRef.set({
        data: result,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return result;
    } catch (error) {
      console.error('Error normalizing drug name:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to normalize drug name'
      );
    }
  }
);
```

### 6. Function Exports (`functions/src/index.ts`)
```typescript
export { normalizeDrugName } from './rxnorm/normalize';
```

### 7. Functions Package Configuration (`functions/package.json`)
```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### 8. Functions TypeScript Config (`functions/tsconfig.json`)
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2017"
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

## Validation Checklist

- [x] RxNorm API calls successful for drug normalization
- [x] Caching service stores and retrieves data correctly
- [x] Cache expires after configured TTL
- [x] API errors are handled gracefully
- [x] Retry logic works for failed requests
- [x] Cloud Function deploys successfully
- [x] Cloud Function is callable from client
- [x] Drug search autocomplete returns results
- [x] NDC lookup works for RxCUI
- [x] Firestore cache is created and used

## Success Criteria

✅ RxNorm API integration complete  
✅ Client-side caching functional  
✅ Server-side Cloud Function deployed  
✅ Error handling comprehensive  
✅ Retry logic with backoff working  
✅ All RxNorm endpoints accessible

## Completion Notes

**Completed:** 2025-11-12

**Implementation Summary:**
- ✅ Integrated CTSS RxTerms API (`clinicaltables.nlm.nih.gov/api/rxterms/v3/search`) as primary autocomplete endpoint
- ✅ Implemented Firebase Cloud Functions (`normalizeDrugName`, `searchDrugs`) with Firestore caching
- ✅ Created client-side RxNorm service using `httpsCallable` for secure API access
- ✅ Implemented client-side caching service with TTL support
- ✅ Added comprehensive error handling with `ApiError` class
- ✅ Integrated autocomplete in `DrugSearchInput.svelte` with debouncing (300ms) and race condition prevention
- ✅ Fixed CTSS response parsing (handles nested array format: `[["ADVIL (Oral Liquid)"], ...]`)
- ✅ Added source tracking to identify which API was used (CTSS vs approximateTerm fallback)

**Key Files Created:**
- `src/lib/types/rxnorm.ts` - TypeScript interfaces for RxNorm responses
- `src/lib/utils/api-helpers.ts` - HTTP helpers (fetchWithTimeout, retryWithBackoff, ApiError)
- `src/lib/services/cache.service.ts` - Generic client-side caching service
- `src/lib/services/rxnorm.service.ts` - RxNorm API client (uses Cloud Functions)
- `functions/src/rxnorm/normalize.ts` - Cloud Functions for RxNorm (normalizeDrugName, searchDrugs)

**Key Files Modified:**
- `src/lib/components/calculator/DrugSearchInput.svelte` - Replaced static list with live RxNorm search
- `functions/src/index.ts` - Exported RxNorm functions
- `functions/package.json` - Updated Node.js to v20

**API Endpoints Used:**
- Primary: CTSS RxTerms (`/api/rxterms/v3/search`) - Purpose-built for autocomplete
- Fallback: RxNorm `approximateTerm.json` - For fuzzy matching when CTSS returns 0 results

**Performance:**
- Client-side cache: 1 hour TTL for search results
- Server-side cache: 1 hour TTL for search, 7 days for normalization
- Search works with 3+ characters
- Debounce: 300ms to limit API calls

**Testing:**
- ✅ Verified with "advil", "metformin", "meth", "aspirin", "ibuprofen"
- ✅ Confirmed CTSS API returns clean display names with RxCUI
- ✅ Verified fallback to approximateTerm works when CTSS returns 0 results
- ✅ Confirmed caching reduces redundant API calls

---
