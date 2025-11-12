<script lang="ts">
	import CalculationSummary from './CalculationSummary.svelte';
	import RecommendedPackages from './RecommendedPackages.svelte';
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

	<!-- High Priority Warnings Only (at top) -->
	{#if result.warnings.filter(w => w.severity === 'high').length > 0}
		<WarningsList warnings={result.warnings.filter(w => w.severity === 'high')} />
	{/if}

	<!-- Calculation Summary -->
	<CalculationSummary {result} />

	<!-- Low/Medium Priority Info Notes (below summary) -->
	{#if result.warnings.filter(w => w.severity !== 'high').length > 0}
		<WarningsList warnings={result.warnings.filter(w => w.severity !== 'high')} />
	{/if}

	<!-- AI Explanation -->
	<ExplanationCard explanation={result.explanation} />

	<!-- Recommended Packages -->
	<RecommendedPackages
		optimization={result.optimization}
		products={result.activeProducts}
		totalQuantityNeeded={result.quantity.totalQuantityNeeded}
	/>

	<!-- Additional Details -->
	<details class="border rounded-lg p-4">
		<summary class="cursor-pointer font-medium">
			View All Available Products ({result.activeProducts.length} active, {result.inactiveProducts.length} inactive)
		</summary>
		<div class="mt-4 space-y-4">
			<!-- Active Products -->
			{#if result.activeProducts.length > 0}
				<div>
					<h4 class="font-semibold text-sm mb-2 text-green-600">
						Active Products ({result.activeProducts.length})
					</h4>
					<div class="space-y-2 max-h-60 overflow-y-auto">
						{#each result.activeProducts as product}
							<div class="flex items-center justify-between text-sm p-2 rounded bg-green-50">
								<div>
									<p class="font-medium">NDC: {product.ndc}</p>
									<p class="text-muted-foreground">
										{product.manufacturer} - {product.packageDescription}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Inactive Products (only show if there are any) -->
			{#if result.inactiveProducts.length > 0}
				<div>
					<h4 class="font-semibold text-sm mb-2 text-destructive">
						Inactive Products ({result.inactiveProducts.length}) - Excluded from Recommendations
					</h4>
					<div class="space-y-2 max-h-60 overflow-y-auto">
						{#each result.inactiveProducts as product}
							<div class="flex items-center justify-between text-sm p-2 rounded bg-red-50">
								<div>
									<p class="font-medium">NDC: {product.ndc}</p>
									<p class="text-muted-foreground">
										{product.manufacturer} - {product.packageDescription}
									</p>
								</div>
								<span class="text-destructive text-xs">Inactive</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</details>
</div>

