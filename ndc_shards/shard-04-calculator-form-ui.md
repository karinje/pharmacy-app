# SHARD 4: Calculator Form UI

## Objective
Build the main calculator interface with drug input form, validation, and user experience enhancements.

## Dependencies
- Shard 1 (Project Foundation)
- Shard 2 (Authentication)
- Shard 3 (UI Components)

## Files to Create/Modify

```
src/
├── lib/
│   ├── components/
│   │   ├── calculator/
│   │   │   ├── CalculatorForm.svelte     # NEW: Main form component
│   │   │   ├── DrugSearchInput.svelte    # NEW: Drug name autocomplete
│   │   │   ├── InstructionsInput.svelte  # NEW: Instructions textarea
│   │   │   ├── DaysSupplyInput.svelte    # NEW: Days supply number input
│   │   │   └── FormActions.svelte        # NEW: Submit/reset buttons
│   │   └── feedback/
│   │       ├── LoadingState.svelte       # NEW: Loading overlay
│   │       └── ErrorState.svelte         # NEW: Error display
│   ├── stores/
│   │   └── calculator.ts                 # NEW: Calculator state
│   ├── types/
│   │   └── calculator.ts                 # NEW: Calculator-specific types
│   └── utils/
│       └── calculator-validation.ts      # NEW: Form validation logic
└── routes/
    └── (authenticated)/
        └── calculator/
            └── +page.svelte              # MODIFY: Calculator page
```

## Implementation Details

### 1. Calculator Types (`src/lib/types/calculator.ts`)
```typescript
import type { z } from 'zod';
import type { calculatorFormSchema } from '$lib/utils/calculator-validation';

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

export interface CalculatorState {
  input: CalculatorFormData;
  isCalculating: boolean;
  result: CalculationResult | null;
  error: string | null;
}

export interface CalculationRequest {
  drugName: string;
  instructions: string;
  daysSupply: number;
}

export interface CalculationResult {
  id: string;
  rxnormData: {
    rxcui: string;
    name: string;
  };
  totalQuantityNeeded: number;
  recommendedPackages: PackageRecommendation[];
  explanation: string;
  warnings: Warning[];
  alternatives: Alternative[];
  timestamp: Date;
}

export interface PackageRecommendation {
  ndc: string;
  productName: string;
  manufacturer: string;
  packageSize: number;
  quantity: number;
  totalUnits: number;
  wasteUnits: number;
  wastePercentage: number;
  rank: number;
  reasoning: string;
}

export interface Warning {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export interface Alternative {
  description: string;
  packages: PackageRecommendation[];
  pros: string[];
  cons: string[];
}
```

### 2. Calculator Validation (`src/lib/utils/calculator-validation.ts`)
```typescript
import { z } from 'zod';

export const calculatorFormSchema = z.object({
  drugName: z
    .string()
    .min(2, 'Drug name must be at least 2 characters')
    .max(200, 'Drug name is too long')
    .regex(/^[a-zA-Z0-9\s\-]+$/, 'Drug name contains invalid characters'),
  
  instructions: z
    .string()
    .min(5, 'Instructions must be at least 5 characters')
    .max(500, 'Instructions are too long'),
  
  daysSupply: z
    .number()
    .int('Days supply must be a whole number')
    .min(1, 'Days supply must be at least 1 day')
    .max(365, 'Days supply cannot exceed 365 days')
});

export type CalculatorFormData = z.infer<typeof calculatorFormSchema>;

// Common medical abbreviations and patterns
export const MEDICAL_ABBREVIATIONS = {
  'QD': 'once daily',
  'BID': 'twice daily',
  'TID': 'three times daily',
  'QID': 'four times daily',
  'Q4H': 'every 4 hours',
  'Q6H': 'every 6 hours',
  'Q8H': 'every 8 hours',
  'Q12H': 'every 12 hours',
  'PRN': 'as needed',
  'PO': 'by mouth',
  'HS': 'at bedtime',
  'AC': 'before meals',
  'PC': 'after meals'
};

export function validateInstructions(instructions: string): {
  isValid: boolean;
  suggestions?: string[];
  warnings?: string[];
} {
  const upperInstructions = instructions.toUpperCase();
  const suggestions: string[] = [];
  const warnings: string[] = [];

  // Check for common abbreviations
  Object.entries(MEDICAL_ABBREVIATIONS).forEach(([abbr, meaning]) => {
    if (upperInstructions.includes(abbr)) {
      suggestions.push(`${abbr} = ${meaning}`);
    }
  });

  // Check for ambiguous instructions
  if (upperInstructions.includes('AS NEEDED') || upperInstructions.includes('PRN')) {
    warnings.push('Instructions include "as needed" - quantity may vary');
  }

  // Check for missing dosage information
  if (!/\d+\s*(tablet|capsule|ml|unit|puff)/i.test(instructions)) {
    warnings.push('Instructions may be missing dosage amount');
  }

  return {
    isValid: true,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}
```

### 3. Calculator Store (`src/lib/stores/calculator.ts`)
```typescript
import { writable, derived } from 'svelte/store';
import type { CalculatorState, CalculationRequest } from '$lib/types/calculator';

function createCalculatorStore() {
  const initialState: CalculatorState = {
    input: {
      drugName: '',
      instructions: '',
      daysSupply: 30
    },
    isCalculating: false,
    result: null,
    error: null
  };

  const { subscribe, set, update } = writable<CalculatorState>(initialState);

  return {
    subscribe,
    
    setInput: (input: Partial<CalculatorState['input']>) => {
      update((state) => ({
        ...state,
        input: { ...state.input, ...input }
      }));
    },

    setCalculating: (isCalculating: boolean) => {
      update((state) => ({ ...state, isCalculating }));
    },

    setResult: (result: CalculatorState['result']) => {
      update((state) => ({
        ...state,
        result,
        isCalculating: false,
        error: null
      }));
    },

    setError: (error: string) => {
      update((state) => ({
        ...state,
        error,
        isCalculating: false,
        result: null
      }));
    },

    reset: () => {
      set(initialState);
    },

    clearResult: () => {
      update((state) => ({
        ...state,
        result: null,
        error: null
      }));
    }
  };
}

export const calculatorStore = createCalculatorStore();

// Derived stores
export const calculatorInput = derived(
  calculatorStore,
  ($store) => $store.input
);

export const isCalculating = derived(
  calculatorStore,
  ($store) => $store.isCalculating
);

export const calculationResult = derived(
  calculatorStore,
  ($store) => $store.result
);

export const calculationError = derived(
  calculatorStore,
  ($store) => $store.error
);
```

### 4. Drug Search Input (`src/lib/components/calculator/DrugSearchInput.svelte`)
```svelte
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { cn } from '$lib/utils/cn';

  export let value: string = '';
  export let error: string | undefined = undefined;
  export let disabled: boolean = false;

  let focused = false;
  let suggestions: string[] = [];

  // Common drug names for autocomplete (will be enhanced with API in later shards)
  const COMMON_DRUGS = [
    'Metformin 500mg',
    'Metformin 850mg',
    'Metformin 1000mg',
    'Lisinopril 10mg',
    'Lisinopril 20mg',
    'Atorvastatin 10mg',
    'Atorvastatin 20mg',
    'Atorvastatin 40mg',
    'Levothyroxine 25mcg',
    'Levothyroxine 50mcg',
    'Amlodipine 5mg',
    'Amlodipine 10mg'
  ];

  function handleInput() {
    if (value.length >= 2) {
      suggestions = COMMON_DRUGS.filter((drug) =>
        drug.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
    } else {
      suggestions = [];
    }
  }

  function selectSuggestion(drug: string) {
    value = drug;
    suggestions = [];
    focused = false;
  }

  function handleBlur() {
    // Delay to allow click on suggestion
    setTimeout(() => {
      focused = false;
      suggestions = [];
    }, 200);
  }
</script>

<div class="space-y-2">
  <Label for="drug-name">
    Drug Name
    <span class="text-destructive">*</span>
  </Label>
  
  <div class="relative">
    <Input
      id="drug-name"
      type="text"
      placeholder="e.g., Metformin 500mg"
      bind:value
      on:input={handleInput}
      on:focus={() => (focused = true)}
      on:blur={handleBlur}
      {disabled}
      class={cn(error && 'border-destructive focus-visible:ring-destructive')}
    />

    {#if focused && suggestions.length > 0}
      <div
        class="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
      >
        {#each suggestions as suggestion}
          <button
            type="button"
            class="w-full px-4 py-2 text-left hover:bg-accent hover:text-accent-foreground cursor-pointer"
            on:click={() => selectSuggestion(suggestion)}
          >
            {suggestion}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  {#if error}
    <p class="text-sm text-destructive">{error}</p>
  {:else}
    <p class="text-sm text-muted-foreground">
      Enter the drug name and strength (e.g., Metformin 500mg)
    </p>
  {/if}
</div>
```

### 5. Instructions Input (`src/lib/components/calculator/InstructionsInput.svelte`)
```svelte
<script lang="ts">
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import { Badge } from '$lib/components/ui/badge';
  import { Alert, AlertDescription } from '$lib/components/ui/alert';
  import { cn } from '$lib/utils/cn';
  import { validateInstructions, MEDICAL_ABBREVIATIONS } from '$lib/utils/calculator-validation';

  export let value: string = '';
  export let error: string | undefined = undefined;
  export let disabled: boolean = false;

  let validation: ReturnType<typeof validateInstructions> | null = null;

  function handleInput() {
    if (value.length >= 5) {
      validation = validateInstructions(value);
    } else {
      validation = null;
    }
  }
</script>

<div class="space-y-2">
  <Label for="instructions">
    Instructions
    <span class="text-destructive">*</span>
  </Label>

  <Textarea
    id="instructions"
    placeholder="e.g., Take 2 tablets twice daily&#10;or&#10;Take 1 tablet BID"
    bind:value
    on:input={handleInput}
    {disabled}
    rows={3}
    class={cn(error && 'border-destructive focus-visible:ring-destructive')}
  />

  {#if error}
    <p class="text-sm text-destructive">{error}</p>
  {:else if validation?.suggestions || validation?.warnings}
    <div class="space-y-2">
      {#if validation.suggestions}
        <div class="flex flex-wrap gap-2">
          {#each validation.suggestions as suggestion}
            <Badge variant="secondary">{suggestion}</Badge>
          {/each}
        </div>
      {/if}
      
      {#if validation.warnings}
        {#each validation.warnings as warning}
          <Alert variant="default">
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        {/each}
      {/if}
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">
      Enter dosing instructions. Common abbreviations: BID (twice daily), TID (three times daily), QD (once daily)
    </p>
  {/if}

  <!-- Common abbreviations reference -->
  <details class="text-sm text-muted-foreground">
    <summary class="cursor-pointer hover:text-foreground">
      Common Medical Abbreviations
    </summary>
    <div class="mt-2 grid grid-cols-2 gap-2 p-2 bg-muted rounded-md">
      {#each Object.entries(MEDICAL_ABBREVIATIONS) as [abbr, meaning]}
        <div>
          <span class="font-medium">{abbr}:</span> {meaning}
        </div>
      {/each}
    </div>
  </details>
</div>
```

### 6. Days Supply Input (`src/lib/components/calculator/DaysSupplyInput.svelte`)
```svelte
<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/utils/cn';

  export let value: number = 30;
  export let error: string | undefined = undefined;
  export let disabled: boolean = false;

  const COMMON_SUPPLIES = [7, 14, 30, 60, 90];

  function setQuickValue(days: number) {
    value = days;
  }
</script>

<div class="space-y-2">
  <Label for="days-supply">
    Days Supply
    <span class="text-destructive">*</span>
  </Label>

  <div class="flex gap-2">
    <Input
      id="days-supply"
      type="number"
      min="1"
      max="365"
      bind:value
      {disabled}
      class={cn('flex-1', error && 'border-destructive focus-visible:ring-destructive')}
    />
    <span class="flex items-center text-muted-foreground">days</span>
  </div>

  {#if error}
    <p class="text-sm text-destructive">{error}</p>
  {:else}
    <p class="text-sm text-muted-foreground">
      Number of days the prescription should last
    </p>
  {/if}

  <!-- Quick select buttons -->
  <div class="flex flex-wrap gap-2">
    <span class="text-sm text-muted-foreground">Quick select:</span>
    {#each COMMON_SUPPLIES as days}
      <Button
        type="button"
        variant={value === days ? 'default' : 'outline'}
        size="sm"
        on:click={() => setQuickValue(days)}
        {disabled}
      >
        {days}
      </Button>
    {/each}
  </div>
</div>
```

### 7. Form Actions (`src/lib/components/calculator/FormActions.svelte`)
```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Spinner } from '$lib/components/ui/spinner';

  export let isSubmitting: boolean = false;
  export let isValid: boolean = false;
  export let onReset: () => void;
</script>

<div class="flex gap-4 justify-end">
  <Button
    type="button"
    variant="outline"
    on:click={onReset}
    disabled={isSubmitting}
  >
    Clear
  </Button>
  
  <Button
    type="submit"
    disabled={!isValid || isSubmitting}
    class="min-w-[120px]"
  >
    {#if isSubmitting}
      <Spinner size="sm" class="mr-2" />
      Calculating...
    {:else}
      Calculate
    {/if}
  </Button>
</div>
```

### 8. Loading State (`src/lib/components/feedback/LoadingState.svelte`)
```svelte
<script lang="ts">
  import { Card, CardContent } from '$lib/components/ui/card';
  import { Spinner } from '$lib/components/ui/spinner';

  export let message: string = 'Processing your request...';
</script>

<Card>
  <CardContent class="flex flex-col items-center justify-center py-12">
    <Spinner size="lg" class="mb-4" />
    <p class="text-lg font-medium">{message}</p>
    <p class="text-sm text-muted-foreground mt-2">This may take a few seconds</p>
  </CardContent>
</Card>
```

### 9. Error State (`src/lib/components/feedback/ErrorState.svelte`)
```svelte
<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
  import { Button } from '$lib/components/ui/button';

  export let title: string = 'Something went wrong';
  export let message: string;
  export let onRetry: (() => void) | null = null;
</script>

<Alert variant="destructive" class="my-4">
  <AlertTitle>{title}</AlertTitle>
  <AlertDescription class="mt-2">
    <p>{message}</p>
    {#if onRetry}
      <Button
        variant="outline"
        size="sm"
        class="mt-4"
        on:click={onRetry}
      >
        Try Again
      </Button>
    {/if}
  </AlertDescription>
</Alert>
```

### 10. Calculator Form (`src/lib/components/calculator/CalculatorForm.svelte`)
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import DrugSearchInput from './DrugSearchInput.svelte';
  import InstructionsInput from './InstructionsInput.svelte';
  import DaysSupplyInput from './DaysSupplyInput.svelte';
  import FormActions from './FormActions.svelte';
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { calculatorFormSchema } from '$lib/utils/calculator-validation';
  import type { CalculatorFormData } from '$lib/types/calculator';

  export let isSubmitting: boolean = false;

  const dispatch = createEventDispatcher<{
    submit: CalculatorFormData;
    reset: void;
  }>();

  let formData: CalculatorFormData = {
    drugName: '',
    instructions: '',
    daysSupply: 30
  };

  let errors: Partial<Record<keyof CalculatorFormData, string>> = {};

  $: isValid = 
    formData.drugName.length >= 2 &&
    formData.instructions.length >= 5 &&
    formData.daysSupply >= 1 &&
    formData.daysSupply <= 365;

  function handleSubmit() {
    // Clear previous errors
    errors = {};

    try {
      // Validate form data
      const validated = calculatorFormSchema.parse(formData);
      
      // Dispatch submit event
      dispatch('submit', validated);
    } catch (error) {
      // Handle validation errors
      if (error.errors) {
        error.errors.forEach((err: any) => {
          errors[err.path[0]] = err.message;
        });
      }
    }
  }

  function handleReset() {
    formData = {
      drugName: '',
      instructions: '',
      daysSupply: 30
    };
    errors = {};
    dispatch('reset');
  }
</script>

<Card>
  <CardHeader>
    <h2 class="text-2xl font-bold">NDC Calculator</h2>
    <p class="text-muted-foreground">
      Enter prescription details to calculate recommended NDC packages
    </p>
  </CardHeader>

  <CardContent>
    <form on:submit|preventDefault={handleSubmit} class="space-y-6">
      <DrugSearchInput
        bind:value={formData.drugName}
        error={errors.drugName}
        disabled={isSubmitting}
      />

      <InstructionsInput
        bind:value={formData.instructions}
        error={errors.instructions}
        disabled={isSubmitting}
      />

      <DaysSupplyInput
        bind:value={formData.daysSupply}
        error={errors.daysSupply}
        disabled={isSubmitting}
      />

      <FormActions
        {isSubmitting}
        {isValid}
        onReset={handleReset}
      />
    </form>
  </CardContent>
</Card>
```

### 11. Calculator Page (`src/routes/(authenticated)/calculator/+page.svelte`)
```svelte
<script lang="ts">
  import CalculatorForm from '$lib/components/calculator/CalculatorForm.svelte';
  import LoadingState from '$lib/components/feedback/LoadingState.svelte';
  import ErrorState from '$lib/components/feedback/ErrorState.svelte';
  import { calculatorStore } from '$lib/stores/calculator';
  import type { CalculatorFormData } from '$lib/types/calculator';

  let isCalculating = false;
  let error: string | null = null;

  async function handleSubmit(event: CustomEvent<CalculatorFormData>) {
    isCalculating = true;
    error = null;

    try {
      // TODO: Implement actual calculation logic in next shard
      // For now, simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Placeholder - will be replaced with actual API calls
      console.log('Form submitted:', event.detail);
      
      // Show success message
      alert('Form validated successfully! API integration coming in next shard.');
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unexpected error occurred';
    } finally {
      isCalculating = false;
    }
  }

  function handleReset() {
    calculatorStore.reset();
    error = null;
  }

  function handleRetry() {
    error = null;
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
    <ErrorState
      message={error}
      onRetry={handleRetry}
    />
  {/if}

  {#if isCalculating}
    <LoadingState message="Calculating optimal packages..." />
  {:else}
    <CalculatorForm
      isSubmitting={isCalculating}
      on:submit={handleSubmit}
      on:reset={handleReset}
    />
  {/if}
</div>
```

## Validation Checklist

- [ ] Form renders with all input fields
- [ ] Drug name autocomplete suggests drugs
- [ ] Instructions validation recognizes medical abbreviations
- [ ] Days supply accepts numbers 1-365
- [ ] Quick select buttons work for common day supplies
- [ ] Form validation prevents submission with invalid data
- [ ] Error messages display for each field
- [ ] Loading state displays during submission
- [ ] Clear button resets all form fields
- [ ] Form is responsive on mobile devices
- [ ] Keyboard navigation works throughout form
- [ ] Medical abbreviations reference is accessible

## Success Criteria

✅ Complete calculator form UI implemented  
✅ Form validation working with Zod schema  
✅ All input components functional  
✅ Loading and error states display correctly  
✅ Form state managed with Svelte stores  
✅ Accessibility features implemented

---

Due to length constraints, I'll create the complete document and save it for you.
