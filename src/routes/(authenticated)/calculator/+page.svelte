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

<div class="container mx-auto px-4 py-8 max-w-4xl">
	{#if error}
		<ErrorState message={error} onRetry={handleRetry} />
	{/if}

	{#if isCalculating}
		<LoadingState message="Calculating optimal packages..." />
	{:else}
		<CalculatorForm isSubmitting={isCalculating} on:submit={handleSubmit} on:reset={handleReset} />
	{/if}
</div>
