<script lang="ts">
	import CalculatorForm from '$lib/components/calculator/CalculatorForm.svelte';
	import LoadingState from '$lib/components/feedback/LoadingState.svelte';
	import ErrorState from '$lib/components/feedback/ErrorState.svelte';
	import { calculatorStore, calculationProgress } from '$lib/stores/calculator';
	import { calculationService } from '$lib/services/calculation.service';
	import type { CalculatorFormData } from '$lib/types/calculator';
	import type { CalculationProgress } from '$lib/types/calculation';
	import type { PageProps } from './$types';

	// Suppress SvelteKit params warning
	export let params: PageProps['params'];

	let isCalculating = false;
	let error: string | null = null;
	let progress: CalculationProgress | null = null;

	async function handleSubmit(event: CustomEvent<CalculatorFormData>) {
		console.log('Form submitted:', event.detail);
		isCalculating = true;
		error = null;
		progress = null;
		calculatorStore.setCalculating(true);

		try {
			const input = event.detail;
			console.log('Input received:', input);

			// Validate input
			const validation = calculationService.validateInput(input);
			console.log('Validation result:', validation);
			if (!validation.isValid) {
				throw new Error(validation.errors.join(', '));
			}

			console.log('Starting calculation...');
			// Perform calculation with progress updates
			const result = await calculationService.calculate(input, (p) => {
				progress = p;
				calculatorStore.setProgress(p);
				console.log('Progress update:', p);
			});

			// Store result
			calculatorStore.setResult(result);

			// Navigate to results (will be implemented in next shard)
			console.log('Calculation complete:', result);
		} catch (err) {
			console.error('Calculation error:', err);
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
