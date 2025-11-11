# SHARD 8: Core Calculation Orchestration

## Objective
Integrate all API services (RxNorm, FDA, OpenAI) into a unified calculation workflow with comprehensive error handling.

## Dependencies
- Shard 5 (RxNorm)
- Shard 6 (FDA)
- Shard 7 (OpenAI)

## Files to Create/Modify

```
src/
├── lib/
│   ├── services/
│   │   └── calculation.service.ts       # NEW: Main calculation orchestrator
│   ├── stores/
│   │   └── calculator.ts                # MODIFY: Connect to service
│   └── types/
│       └── calculation.ts               # NEW: Unified calculation types
└── routes/
    └── (authenticated)/
        └── calculator/
            └── +page.svelte             # MODIFY: Use real calculation
```

## Implementation Details

### 1. Unified Calculation Types (`src/lib/types/calculation.ts`)
```typescript
import type { RxNormConcept } from './rxnorm';
import type { NDCProduct } from './fda';
import type { InstructionParsing, QuantityCalculation, PackageOptimization } from './openai';

export interface CalculationInput {
  drugName: string;
  instructions: string;
  daysSupply: number;
}

export interface CalculationResult {
  id: string;
  
  // Input
  input: CalculationInput;
  
  // RxNorm data
  rxnormData: {
    rxcui: string;
    name: string;
    confidence: 'high' | 'medium' | 'low';
  };
  
  // FDA data
  allProducts: NDCProduct[];
  activeProducts: NDCProduct[];
  inactiveProducts: NDCProduct[];
  
  // OpenAI analysis
  parsing: InstructionParsing;
  quantity: QuantityCalculation;
  optimization: PackageOptimization;
  explanation: string;
  
  // Warnings
  warnings: Warning[];
  
  // Metadata
  timestamp: Date;
  userId?: string;
}

export interface Warning {
  type: 'parsing' | 'rxnorm' | 'fda' | 'optimization' | 'inactive_ndc';
  severity: 'high' | 'medium' | 'low';
  message: string;
  details?: unknown;
}

export interface CalculationProgress {
  stage: 'normalizing' | 'fetching_ndcs' | 'calculating' | 'optimizing' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}
```

### 2. Calculation Service (`src/lib/services/calculation.service.ts`)
```typescript
import { rxnormService } from './rxnorm.service';
import { fdaService } from './fda.service';
import { openaiService } from './openai.service';
import type { CalculationInput, CalculationResult, CalculationProgress, Warning } from '$lib/types/calculation';
import { ApiError } from '$lib/utils/api-helpers';

class CalculationService {
  /**
   * Main calculation workflow
   */
  async calculate(
    input: CalculationInput,
    onProgress?: (progress: CalculationProgress) => void
  ): Promise<CalculationResult> {
    const warnings: Warning[] = [];
    const startTime = Date.now();

    try {
      // Stage 1: Normalize drug name with RxNorm
      onProgress?.({
        stage: 'normalizing',
        message: 'Looking up drug in RxNorm database...',
        progress: 10
      });

      const normalized = await rxnormService.normalizeDrugName(input.drugName);

      if (normalized.confidence === 'low') {
        warnings.push({
          type: 'rxnorm',
          severity: 'medium',
          message: `Low confidence match for "${input.drugName}". Using: ${normalized.name}`,
          details: { alternatives: normalized.alternatives }
        });
      }

      // Stage 2: Fetch NDC products from FDA
      onProgress?.({
        stage: 'fetching_ndcs',
        message: 'Fetching available NDC products...',
        progress: 30
      });

      const allProducts = await fdaService.searchNDCsByDrugName(normalized.name);

      if (allProducts.length === 0) {
        throw new ApiError(
          'No NDC products found for this drug',
          404,
          'FDA'
        );
      }

      const activeProducts = fdaService.filterActiveNDCs(allProducts);
      const inactiveProducts = fdaService.filterInactiveNDCs(allProducts);

      if (activeProducts.length === 0) {
        warnings.push({
          type: 'fda',
          severity: 'high',
          message: 'No active NDC products available. All products are inactive.',
          details: { inactiveCount: inactiveProducts.length }
        });
      }

      if (inactiveProducts.length > 0) {
        warnings.push({
          type: 'inactive_ndc',
          severity: 'medium',
          message: `${inactiveProducts.length} inactive NDC(s) found in database`,
          details: { inactive: inactiveProducts.map(p => p.ndc) }
        });
      }

      // Stage 3: Calculate with OpenAI
      onProgress?.({
        stage: 'calculating',
        message: 'Analyzing prescription instructions...',
        progress: 50
      });

      const openaiRequest = {
        drugName: normalized.name,
        rxcui: normalized.rxcui,
        instructions: input.instructions,
        daysSupply: input.daysSupply,
        availablePackages: allProducts.map(p => ({
          ndc: p.ndc,
          size: p.packageSize,
          manufacturer: p.manufacturer,
          isActive: p.isActive
        }))
      };

      const openaiResult = await openaiService.calculatePrescription(openaiRequest);

      // Stage 4: Compile results
      onProgress?.({
        stage: 'optimizing',
        message: 'Optimizing package selection...',
        progress: 80
      });

      // Merge warnings
      warnings.push(...openaiResult.warnings);

      // Generate unique ID
      const id = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result: CalculationResult = {
        id,
        input,
        rxnormData: {
          rxcui: normalized.rxcui,
          name: normalized.name,
          confidence: normalized.confidence
        },
        allProducts,
        activeProducts,
        inactiveProducts,
        parsing: openaiResult.parsing,
        quantity: openaiResult.quantity,
        optimization: openaiResult.optimization,
        explanation: await openaiService.generateExplanation(
          normalized.name,
          input.instructions,
          input.daysSupply,
          openaiResult.parsing,
          openaiResult.quantity,
          openaiResult.optimization
        ),
        warnings: this.sortWarnings(warnings),
        timestamp: new Date()
      };

      onProgress?.({
        stage: 'complete',
        message: 'Calculation complete!',
        progress: 100
      });

      const duration = Date.now() - startTime;
      console.log(`Calculation completed in ${duration}ms`);

      return result;
    } catch (error) {
      onProgress?.({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Calculation failed',
        progress: 0
      });

      throw error;
    }
  }

  /**
   * Sort warnings by severity
   */
  private sortWarnings(warnings: Warning[]): Warning[] {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return warnings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Validate calculation input
   */
  validateInput(input: CalculationInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.drugName || input.drugName.trim().length < 2) {
      errors.push('Drug name must be at least 2 characters');
    }

    if (!input.instructions || input.instructions.trim().length < 5) {
      errors.push('Instructions must be at least 5 characters');
    }

    if (!input.daysSupply || input.daysSupply < 1 || input.daysSupply > 365) {
      errors.push('Days supply must be between 1 and 365');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const calculationService = new CalculationService();
```

### 3. Update Calculator Store (`src/lib/stores/calculator.ts`)
```typescript
import { writable, derived } from 'svelte/store';
import type { CalculationResult, CalculationProgress } from '$lib/types/calculation';

interface CalculatorState {
  result: CalculationResult | null;
  progress: CalculationProgress | null;
  isCalculating: boolean;
  error: string | null;
}

function createCalculatorStore() {
  const initialState: CalculatorState = {
    result: null,
    progress: null,
    isCalculating: false,
    error: null
  };

  const { subscribe, set, update } = writable<CalculatorState>(initialState);

  return {
    subscribe,

    setCalculating: (isCalculating: boolean) => {
      update((state) => ({ ...state, isCalculating, error: null }));
    },

    setProgress: (progress: CalculationProgress) => {
      update((state) => ({ ...state, progress }));
    },

    setResult: (result: CalculationResult) => {
      update((state) => ({
        ...state,
        result,
        isCalculating: false,
        progress: null,
        error: null
      }));
    },

    setError: (error: string) => {
      update((state) => ({
        ...state,
        error,
        isCalculating: false,
        progress: null,
        result: null
      }));
    },

    reset: () => {
      set(initialState);
    }
  };
}

export const calculatorStore = createCalculatorStore();

// Derived stores
export const calculationResult = derived(calculatorStore, ($store) => $store.result);
export const isCalculating = derived(calculatorStore, ($store) => $store.isCalculating);
export const calculationProgress = derived(calculatorStore, ($store) => $store.progress);
export const calculationError = derived(calculatorStore, ($store) => $store.error);
```

### 4. Update Calculator Page (`src/routes/(authenticated)/calculator/+page.svelte`)
```svelte
<script lang="ts">
  import CalculatorForm from '$lib/components/calculator/CalculatorForm.svelte';
  import LoadingState from '$lib/components/feedback/LoadingState.svelte';
  import ErrorState from '$lib/components/feedback/ErrorState.svelte';
  import { calculatorStore, calculationProgress } from '$lib/stores/calculator';
  import { calculationService } from '$lib/services/calculation.service';
  import type { CalculatorFormData } from '$lib/types/calculator';
  import type { CalculationProgress } from '$lib/types/calculation';

  let isCalculating = false;
  let error: string | null = null;
  let progress: CalculationProgress | null = null;

  async function handleSubmit(event: CustomEvent<CalculatorFormData>) {
    isCalculating = true;
    error = null;
    progress = null;

    try {
      const input = event.detail;

      // Validate input
      const validation = calculationService.validateInput(input);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Perform calculation with progress updates
      const result = await calculationService.calculate(input, (p) => {
        progress = p;
        calculatorStore.setProgress(p);
      });

      // Store result
      calculatorStore.setResult(result);

      // Navigate to results (will be implemented in next shard)
      console.log('Calculation complete:', result);
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unexpected error occurred';
      calculatorStore.setError(error);
    } finally {
      isCalculating = false;
    }
  }

  function handleReset() {
    calculatorStore.reset();
    error = null;
    progress = null;
  }

  function handleRetry() {
    error = null;
  }

  // Subscribe to progress
  $: if ($calculationProgress) {
    progress = $calculationProgress;
  }
</script>

<svelte:head>
  <title>Calculator - NDC Calculator</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-8">
  <div class="mb-6">
    <h1 class="text-3xl font-bold">NDC Package Calculator</h1>
    <p class="text-muted-foreground mt-2">
      Enter prescription details to find the optimal NDC packaging
    </p>
  </div>

  {#if error}
    <ErrorState message={error} onRetry={handleRetry} />
  {/if}

  {#if isCalculating && progress}
    <LoadingState message={progress.message} />
    
    <!-- Progress bar -->
    <div class="mt-4">
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div
          class="bg-primary h-2.5 rounded-full transition-all duration-300"
          style="width: {progress.progress}%"
        ></div>
      </div>
      <p class="text-sm text-muted-foreground mt-2 text-center">
        {progress.progress}% complete
      </p>
    </div>
  {:else if !isCalculating}
    <CalculatorForm
      isSubmitting={isCalculating}
      on:submit={handleSubmit}
      on:reset={handleReset}
    />
  {/if}
</div>
```

## Validation Checklist

- [ ] Complete calculation workflow executes successfully
- [ ] Progress updates during calculation
- [ ] All API services integrated correctly
- [ ] Error handling at each stage
- [ ] Warnings collected and sorted
- [ ] Results stored in store
- [ ] Input validation works
- [ ] Calculation completes in <10 seconds

## Success Criteria

✅ Complete calculation orchestration working  
✅ All services integrated seamlessly  
✅ Progress tracking functional  
✅ Comprehensive error handling  
✅ Results properly structured  
✅ Performance acceptable (<10s)

---
