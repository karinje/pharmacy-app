# SHARD 11: Testing Suite

**Status:** 🔜 READY TO START

## Objective
Implement comprehensive testing including unit tests, integration tests, and end-to-end tests.

## Dependencies
- ✅ Shard 1-10 (All previous shards) - COMPLETED

## Context from Shard 10

**Completed History & Saved Calculations:**
- `history.service.ts` - Firestore-based history management service with CRUD operations
- `history.ts` store - Reactive Svelte store for history state management
- History UI components:
  - `HistoryCard.svelte` - Displays single saved calculation
  - `HistoryList.svelte` - Grid list with loading/empty states
  - `SearchBar.svelte` - Search and favorites filter
- History pages:
  - `/history` - Main history page with search/filter
  - `/history/[id]` - Detail view for saved calculations
- Auto-save functionality - Calculations automatically saved to history after completion
- Firestore security rules and indexes deployed
- Data transformation for Firestore (handles undefined values and invalid dates)

**Key Implementation Details:**
- `SavedCalculation` interface wraps `CalculationResult` with metadata (notes, favorites, timestamps)
- History service handles data cleaning (removes undefined, validates dates)
- Search supports drug name, instructions, and notes
- Favorites filter and sorting by creation date
- Firestore collection: `calculations` with composite indexes for efficient querying

## Files to Create

```
tests/
├── unit/
│   ├── services/
│   │   ├── rxnorm.service.test.ts
│   │   ├── fda.service.test.ts
│   │   ├── openai.service.test.ts
│   │   └── calculation.service.test.ts
│   ├── utils/
│   │   ├── validation.test.ts
│   │   └── api-helpers.test.ts
│   └── stores/
│       ├── auth.test.ts
│       └── calculator.test.ts
├── integration/
│   ├── calculator-workflow.test.ts
│   └── history-management.test.ts
├── e2e/
│   ├── login.spec.ts
│   ├── calculator.spec.ts
│   └── history.spec.ts
├── setup.ts
└── mocks/
    ├── firebase.mock.ts
    ├── openai.mock.ts
    └── api.mock.ts
```

## Implementation Details

### 1. Test Setup (`package.json` - add to dependencies)
```json
{
  "devDependencies": {
    "@testing-library/svelte": "^4.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@playwright/test": "^1.40.0",
    "vitest": "^1.0.0",
    "happy-dom": "^12.10.0",
    "@vitest/ui": "^1.0.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 2. Vitest Config (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    }
  }
});
```

### 3. Test Setup File (`tests/setup.ts`)
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Firebase
vi.mock('$lib/config/firebase', () => ({
  auth: {},
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
```

### 4. RxNorm Service Tests (`tests/unit/services/rxnorm.service.test.ts`)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rxnormService } from '$lib/services/rxnorm.service';

// Mock fetch
global.fetch = vi.fn();

describe('RxNormService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeDrugName', () => {
    it('should normalize drug name successfully', async () => {
      const mockResponse = {
        approximateGroup: {
          candidate: [
            {
              rxcui: '860975',
              name: 'Metformin 500 MG Oral Tablet',
              score: '100',
              rank: '1'
            }
          ]
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await rxnormService.normalizeDrugName('Metformin 500mg');

      expect(result).toMatchObject({
        rxcui: '860975',
        name: 'Metformin 500 MG Oral Tablet',
        confidence: 'high'
      });
    });

    it('should handle no results', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          approximateGroup: { candidate: [] }
        })
      });

      await expect(
        rxnormService.normalizeDrugName('InvalidDrug123')
      ).rejects.toThrow();
    });

    it('should cache results', async () => {
      const mockResponse = {
        approximateGroup: {
          candidate: [
            {
              rxcui: '860975',
              name: 'Metformin 500 MG Oral Tablet',
              score: '100',
              rank: '1'
            }
          ]
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // First call
      await rxnormService.normalizeDrugName('Metformin');
      
      // Second call should use cache
      await rxnormService.normalizeDrugName('Metformin');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
```

### 5. Validation Tests (`tests/unit/utils/validation.test.ts`)
```typescript
import { describe, it, expect } from 'vitest';
import { calculatorFormSchema, validateInstructions } from '$lib/utils/calculator-validation';

describe('Calculator Validation', () => {
  describe('calculatorFormSchema', () => {
    it('should validate correct input', () => {
      const input = {
        drugName: 'Metformin 500mg',
        instructions: 'Take 1 tablet twice daily',
        daysSupply: 30
      };

      const result = calculatorFormSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject short drug name', () => {
      const input = {
        drugName: 'M',
        instructions: 'Take 1 tablet twice daily',
        daysSupply: 30
      };

      const result = calculatorFormSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject invalid days supply', () => {
      const input = {
        drugName: 'Metformin 500mg',
        instructions: 'Take 1 tablet twice daily',
        daysSupply: 0
      };

      const result = calculatorFormSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe('validateInstructions', () => {
    it('should recognize BID abbreviation', () => {
      const result = validateInstructions('Take 1 tablet BID');
      
      expect(result.isValid).toBe(true);
      expect(result.suggestions).toContain('BID = twice daily');
    });

    it('should warn about PRN instructions', () => {
      const result = validateInstructions('Take 1 tablet as needed');
      
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('as needed');
    });
  });
});
```

### 6. Integration Test (`tests/integration/calculator-workflow.test.ts`)
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculationService } from '$lib/services/calculation.service';

describe('Calculator Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full calculation workflow', async () => {
    const input = {
      drugName: 'Metformin 500mg',
      instructions: 'Take 2 tablets twice daily',
      daysSupply: 90
    };

    const progressUpdates: any[] = [];

    const result = await calculationService.calculate(input, (progress) => {
      progressUpdates.push(progress);
    });

    // Verify progress updates
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[0].stage).toBe('normalizing');
    expect(progressUpdates[progressUpdates.length - 1].stage).toBe('complete');

    // Verify result structure
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('rxnormData');
    expect(result).toHaveProperty('quantity');
    expect(result).toHaveProperty('optimization');
    expect(result.quantity.totalQuantityNeeded).toBe(360); // 2 * 2 * 90
  }, 30000); // 30 second timeout for API calls
});
```

### 7. E2E Tests Setup (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
});
```

### 8. E2E Calculator Test (`tests/e2e/calculator.spec.ts`)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Calculator Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    // Login steps
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should complete calculation', async ({ page }) => {
    await page.goto('/calculator');

    // Fill form
    await page.fill('[name="drugName"]', 'Metformin 500mg');
    await page.fill('[name="instructions"]', 'Take 2 tablets twice daily');
    await page.fill('[name="daysSupply"]', '90');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for results
    await page.waitForSelector('text=Calculation Results', { timeout: 30000 });

    // Verify results displayed
    await expect(page.locator('text=360')).toBeVisible(); // Total quantity
    await expect(page.locator('text=Recommended Packages')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/calculator');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.locator('text=Drug name must be at least 2 characters')).toBeVisible();
  });
});
```

## Validation Checklist

- [ ] Unit tests cover all services
- [ ] Unit tests cover all utilities
- [ ] Integration tests verify workflows
- [ ] E2E tests cover critical user journeys
- [ ] All tests pass
- [ ] Code coverage >80%
- [ ] Tests run in CI/CD pipeline

## Success Criteria

✅ Comprehensive test suite implemented  
✅ >80% code coverage achieved  
✅ All critical paths tested  
✅ E2E tests validate user flows  
✅ Tests automated in CI/CD

---
