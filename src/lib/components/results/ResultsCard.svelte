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
		<AlternativeOptions optimization={result.optimization} />
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

