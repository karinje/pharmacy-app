# SHARD 9: Results Display & Explanation

**Status:** ✅ COMPLETED

## Objective
Create comprehensive results display with NDC recommendations, explanations, warnings, and alternative options.

## Dependencies
- Shard 3 (UI Components)
- Shard 8 (Calculation Orchestration)

## Files to Create/Modify

```
src/
├── lib/
│   └── components/
│       └── results/
│           ├── ResultsCard.svelte           # NEW: Main results container
│           ├── CalculationSummary.svelte    # NEW: Summary section
│           ├── RecommendedPackages.svelte   # NEW: Package recommendations
│           ├── AlternativeOptions.svelte    # NEW: Alternative packages
│           ├── WarningsList.svelte          # NEW: Warnings display
│           ├── ExplanationCard.svelte       # NEW: AI explanation
│           └── ProductDetailsModal.svelte   # NEW: NDC details modal
└── routes/
    └── (authenticated)/
        └── calculator/
            └── +page.svelte                 # MODIFY: Show results
```

## Implementation Details

### 1. Calculation Summary (`src/lib/components/results/CalculationSummary.svelte`)
```svelte
<script lang="ts">
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import type { CalculationResult } from '$lib/types/calculation';

  export let result: CalculationResult;
</script>

<Card>
  <CardHeader>
    <h3 class="text-lg font-semibold">Calculation Summary</h3>
  </CardHeader>
  <CardContent>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <p class="text-sm text-muted-foreground">Drug</p>
        <p class="font-medium">{result.rxnormData.name}</p>
        <Badge variant="secondary" class="mt-1">
          RxCUI: {result.rxnormData.rxcui}
        </Badge>
      </div>

      <div>
        <p class="text-sm text-muted-foreground">Instructions</p>
        <p class="font-medium">{result.input.instructions}</p>
      </div>

      <div>
        <p class="text-sm text-muted-foreground">Days Supply</p>
        <p class="font-medium">{result.input.daysSupply} days</p>
      </div>

      <div>
        <p class="text-sm text-muted-foreground">Total Quantity Needed</p>
        <p class="font-medium text-2xl">{result.quantity.totalQuantityNeeded}</p>
        <p class="text-sm text-muted-foreground">
          {result.parsing.dosageUnit}s
        </p>
      </div>

      <div class="col-span-2">
        <p class="text-sm text-muted-foreground">Calculation</p>
        <p class="text-sm">{result.quantity.calculation}</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. Recommended Packages (`src/lib/components/results/RecommendedPackages.svelte`)
```svelte
<script lang="ts">
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import type { PackageOptimization } from '$lib/types/openai';
  import type { NDCProduct } from '$lib/types/fda';

  export let optimization: PackageOptimization;
  export let products: NDCProduct[];

  function getProductDetails(ndc: string): NDCProduct | undefined {
    return products.find(p => p.ndc === ndc);
  }

  function getRankBadge(rank: number): { variant: 'default' | 'secondary' | 'outline', label: string } {
    if (rank === 1) return { variant: 'default', label: 'Best Option' };
    if (rank === 2) return { variant: 'secondary', label: 'Alternative' };
    return { variant: 'outline', label: 'Option' };
  }
</script>

<Card>
  <CardHeader>
    <h3 class="text-lg font-semibold">Recommended Packages</h3>
    <p class="text-sm text-muted-foreground">{optimization.reasoning}</p>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      {#each optimization.recommendedPackages as pkg}
        {@const product = getProductDetails(pkg.ndc)}
        {@const rankInfo = getRankBadge(pkg.rank)}
        
        <div class="border rounded-lg p-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <Badge variant={rankInfo.variant}>{rankInfo.label}</Badge>
              {#if !product?.isActive}
                <Badge variant="destructive" class="ml-2">Inactive NDC</Badge>
              {/if}
            </div>
            <div class="text-right">
              <p class="text-sm text-muted-foreground">Waste</p>
              <p class="font-semibold text-lg">
                {pkg.wastePercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <div>
              <p class="font-medium">NDC: {pkg.ndc}</p>
              {#if product}
                <p class="text-sm text-muted-foreground">
                  {product.manufacturer}
                </p>
                <p class="text-sm">
                  {product.packageDescription}
                </p>
              {/if}
            </div>

            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p class="text-muted-foreground">Quantity</p>
                <p class="font-medium">{pkg.quantity} bottle{pkg.quantity > 1 ? 's' : ''}</p>
              </div>
              <div>
                <p class="text-muted-foreground">Total Units</p>
                <p class="font-medium">{pkg.totalUnits}</p>
              </div>
              <div>
                <p class="text-muted-foreground">Waste Units</p>
                <p class="font-medium">{pkg.wasteUnits}</p>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </CardContent>
</Card>
```

### 3. Alternative Options (`src/lib/components/results/AlternativeOptions.svelte`)
```svelte
<script lang="ts">
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { Badge } from '$lib/components/ui/badge';
  import type { Alternative } from '$lib/types/openai';

  export let alternatives: Alternative[];
</script>

<Card>
  <CardHeader>
    <h3 class="text-lg font-semibold">Alternative Options</h3>
  </CardHeader>
  <CardContent>
    <div class="space-y-4">
      {#each alternatives as alt}
        <div class="border-l-4 border-primary pl-4">
          <h4 class="font-medium mb-2">{alt.description}</h4>
          
          <div class="space-y-2 text-sm">
            <div>
              <p class="font-medium text-muted-foreground">Packages:</p>
              <ul class="list-disc list-inside">
                {#each alt.packages as pkg}
                  <li>{pkg.quantity}× NDC {pkg.ndc}</li>
                {/each}
              </ul>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="font-medium text-green-600">Pros:</p>
                <ul class="list-disc list-inside">
                  {#each alt.pros as pro}
                    <li class="text-muted-foreground">{pro}</li>
                  {/each}
                </ul>
              </div>

              <div>
                <p class="font-medium text-red-600">Cons:</p>
                <ul class="list-disc list-inside">
                  {#each alt.cons as con}
                    <li class="text-muted-foreground">{con}</li>
                  {/each}
                </ul>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </CardContent>
</Card>
```

### 4. Warnings List (`src/lib/components/results/WarningsList.svelte`)
```svelte
<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
  import type { Warning } from '$lib/types/calculation';
  import { AlertCircle, AlertTriangle, Info } from 'lucide-svelte';

  export let warnings: Warning[];

  function getIcon(severity: Warning['severity']) {
    if (severity === 'high') return AlertCircle;
    if (severity === 'medium') return AlertTriangle;
    return Info;
  }

  function getVariant(severity: Warning['severity']): 'default' | 'destructive' {
    return severity === 'high' ? 'destructive' : 'default';
  }

  $: sortedWarnings = warnings.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
</script>

{#if warnings.length > 0}
  <div class="space-y-3">
    <h3 class="text-lg font-semibold">Warnings & Notes</h3>
    {#each sortedWarnings as warning}
      <Alert variant={getVariant(warning.severity)}>
        <svelte:component this={getIcon(warning.severity)} class="h-4 w-4" />
        <AlertTitle class="capitalize">{warning.severity} Priority</AlertTitle>
        <AlertDescription>{warning.message}</AlertDescription>
      </Alert>
    {/each}
  </div>
{/if}
```

### 5. Explanation Card (`src/lib/components/results/ExplanationCard.svelte`)
```svelte
<script lang="ts">
  import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
  import { Lightbulb } from 'lucide-svelte';

  export let explanation: string;
</script>

<Card>
  <CardHeader>
    <div class="flex items-center gap-2">
      <Lightbulb class="h-5 w-5 text-primary" />
      <h3 class="text-lg font-semibold">AI Explanation</h3>
    </div>
  </CardHeader>
  <CardContent>
    <p class="text-sm leading-relaxed whitespace-pre-line">{explanation}</p>
  </CardContent>
</Card>
```

### 6. Results Container (`src/lib/components/results/ResultsCard.svelte`)
```svelte
<script lang="ts">
  import CalculationSummary from './CalculationSummary.svelte';
  import RecommendedPackages from './RecommendedPackages.svelte';
  import AlternativeOptions from './AlternativeOptions.svelte';
  import WarningsList from './WarningsList.svelte';
  import ExplanationCard from './ExplanationCard.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { CalculationResult } from '$lib/types/calculation';

  export let result: CalculationResult;
  export let onNewCalculation: () => void;
  export let onSave: (() => void) | undefined = undefined;
</script>

<div class="space-y-6">
  <!-- Header Actions -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold">Calculation Results</h2>
      <p class="text-sm text-muted-foreground">
        Calculated on {result.timestamp.toLocaleString()}
      </p>
    </div>
    <div class="flex gap-2">
      {#if onSave}
        <Button variant="outline" on:click={onSave}>
          Save to History
        </Button>
      {/if}
      <Button on:click={onNewCalculation}>
        New Calculation
      </Button>
    </div>
  </div>

  <!-- Warnings (if any) -->
  {#if result.warnings.length > 0}
    <WarningsList warnings={result.warnings} />
  {/if}

  <!-- Calculation Summary -->
  <CalculationSummary {result} />

  <!-- AI Explanation -->
  <ExplanationCard explanation={result.explanation} />

  <!-- Recommended Packages -->
  <RecommendedPackages
    optimization={result.optimization}
    products={result.activeProducts}
  />

  <!-- Alternative Options -->
  {#if result.optimization.alternatives.length > 0}
    <AlternativeOptions alternatives={result.optimization.alternatives} />
  {/if}

  <!-- Additional Details -->
  <details class="border rounded-lg p-4">
    <summary class="cursor-pointer font-medium">
      View All Available Products ({result.allProducts.length})
    </summary>
    <div class="mt-4 space-y-2">
      {#each result.allProducts as product}
        <div class="flex items-center justify-between text-sm">
          <div>
            <p class="font-medium">NDC: {product.ndc}</p>
            <p class="text-muted-foreground">
              {product.manufacturer} - {product.packageDescription}
            </p>
          </div>
          {#if !product.isActive}
            <span class="text-destructive">Inactive</span>
          {/if}
        </div>
      {/each}
    </div>
  </details>
</div>
```

### 7. Update Calculator Page (`src/routes/(authenticated)/calculator/+page.svelte`)
```svelte
<script lang="ts">
  import CalculatorForm from '$lib/components/calculator/CalculatorForm.svelte';
  import ResultsCard from '$lib/components/results/ResultsCard.svelte';
  import LoadingState from '$lib/components/feedback/LoadingState.svelte';
  import ErrorState from '$lib/components/feedback/ErrorState.svelte';
  import {
    calculatorStore,
    calculationResult,
    isCalculating,
    calculationProgress
  } from '$lib/stores/calculator';
  import { calculationService } from '$lib/services/calculation.service';
  import type { CalculatorFormData } from '$lib/types/calculator';

  let error: string | null = null;

  async function handleSubmit(event: CustomEvent<CalculatorFormData>) {
    error = null;
    calculatorStore.setCalculating(true);

    try {
      const input = event.detail;
      const result = await calculationService.calculate(input, (progress) => {
        calculatorStore.setProgress(progress);
      });
      calculatorStore.setResult(result);
    } catch (err) {
      error = err instanceof Error ? err.message : 'An unexpected error occurred';
      calculatorStore.setError(error);
    }
  }

  function handleReset() {
    calculatorStore.reset();
    error = null;
  }

  function handleNewCalculation() {
    calculatorStore.reset();
  }

  function handleSave() {
    // TODO: Implement save to history (next shard)
    alert('Save functionality coming in next shard!');
  }
</script>

<svelte:head>
  <title>Calculator - NDC Calculator</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
  <div class="mb-6">
    <h1 class="text-3xl font-bold">NDC Package Calculator</h1>
    <p class="text-muted-foreground mt-2">
      Enter prescription details to find the optimal NDC packaging
    </p>
  </div>

  {#if error}
    <ErrorState message={error} onRetry={handleReset} />
  {/if}

  {#if $isCalculating && $calculationProgress}
    <LoadingState message={$calculationProgress.message} />
    <div class="mt-4">
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div
          class="bg-primary h-2.5 rounded-full transition-all duration-300"
          style="width: {$calculationProgress.progress}%"
        ></div>
      </div>
    </div>
  {:else if $calculationResult}
    <ResultsCard
      result={$calculationResult}
      onNewCalculation={handleNewCalculation}
      onSave={handleSave}
    />
  {:else}
    <CalculatorForm
      isSubmitting={$isCalculating}
      on:submit={handleSubmit}
      on:reset={handleReset}
    />
  {/if}
</div>
```

## Validation Checklist

- [ ] Results display all calculation data
- [ ] Package recommendations clearly shown
- [ ] Warnings prominently displayed
- [ ] AI explanation readable and helpful
- [ ] Alternative options presented
- [ ] Product details accessible
- [ ] New calculation button works
- [ ] Layout responsive on mobile
- [ ] Information hierarchy clear

## Implementation Notes

### Key Features Implemented

1. **Warning System**
   - High priority warnings shown at top (e.g., "No active NDC products")
   - Low/medium info notes shown below calculation summary
   - Filtered out generic GPT-5 uncertainties (e.g., "Real-world adherence may vary")
   - GPT-5 prompt updated to not generate assumptions/uncertainties

2. **Package Sorting Logic**
   - Sorted by: 1) Meets required quantity, 2) Least waste, 3) Minimum bottles
   - Only shows packages that meet or exceed required quantity
   - Badge shows "Insufficient Quantity" if doesn't meet requirement

3. **UI Improvements**
   - Removed redundant "Alternative Options" section (was duplicate of Recommended Packages)
   - Separated active/inactive products in collapsible sections
   - Clear visual hierarchy with high-priority warnings at top

4. **GPT-5 Integration**
   - Uses Responses API (`/v1/responses`) not Chat Completions
   - Extracts text from nested response structure: `output[1].content[0].text`
   - Reasoning effort set to 'low' for faster responses

## Success Criteria

✅ Complete results UI implemented  
✅ All calculation data displayed  
✅ Clear visual hierarchy  
✅ Responsive design  
✅ Accessible components  
✅ Professional appearance  
✅ Warning filtering implemented  
✅ Package sorting logic implemented  
✅ Alternative Options section removed (redundant)

---
