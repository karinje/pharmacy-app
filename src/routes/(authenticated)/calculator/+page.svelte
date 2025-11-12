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
	import { historyService } from '$lib/services/history.service';
	import { user } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { CalculatorFormData } from '$lib/types/calculator';
	import type { PageData } from './$types';

	// Accept params to avoid SvelteKit warning (even if unused)
	export let params: PageData['params'];

	let error: string | null = null;
	let saving = false;

	async function handleSubmit(event: CustomEvent<CalculatorFormData>) {
		error = null;
		calculatorStore.setCalculating(true);

		try {
			const input = event.detail;
			const result = await calculationService.calculate(input, (progress) => {
				calculatorStore.setProgress(progress);
			});
			calculatorStore.setResult(result);

			// Auto-save to history
			if ($user && result) {
				try {
					await historyService.saveCalculation($user.uid, result);
					console.log('Calculation auto-saved to history');
				} catch (saveError) {
					// Don't show error to user - auto-save is silent
					console.error('Failed to auto-save calculation:', saveError);
				}
			}
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

	async function handleSave() {
		if (!$calculationResult || !$user) return;

		saving = true;
		try {
			const id = await historyService.saveCalculation($user.uid, $calculationResult);

			// Show success message
			alert('Calculation saved to history!');

			// Optional: Navigate to saved calculation
			// goto(`/history/${id}`);
		} catch (error) {
			console.error('Failed to save:', error);
			alert('Failed to save calculation');
		} finally {
			saving = false;
		}
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
