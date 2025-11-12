<script lang="ts">
	import CalculatorForm from '$lib/components/calculator/CalculatorForm.svelte';
	import ResultsCard from '$lib/components/results/ResultsCard.svelte';
	import LoadingState from '$lib/components/feedback/LoadingState.svelte';
	import ErrorState from '$lib/components/feedback/ErrorState.svelte';
	import {
		calculatorStore,
		calculationResult,
		isCalculating,
		calculationProgress,
		calculationError
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

	function handleRetry() {
		error = null;
		calculatorStore.reset();
	}
</script>

<svelte:head>
	<title>Calculator - NDC Calculator</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
	{#if error || $calculationError}
		<ErrorState message={error || $calculationError || 'An error occurred'} onRetry={handleRetry} />
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
			<p class="text-sm text-muted-foreground mt-2 text-center">
				{$calculationProgress.progress}% complete
			</p>
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
