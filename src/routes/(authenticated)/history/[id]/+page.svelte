<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import ResultsCard from '$lib/components/results/ResultsCard.svelte';
	import LoadingState from '$lib/components/feedback/LoadingState.svelte';
	import ErrorState from '$lib/components/feedback/ErrorState.svelte';
	import { historyService, type SavedCalculation } from '$lib/services/history.service';
	import { user } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from 'lucide-svelte';

	let loading = true;
	let error: string | null = null;
	let savedCalculation: SavedCalculation | null = null;

	onMount(async () => {
		const id = $page.params.id;
		if (id && $user) {
			await loadCalculation(id);
		}
	});

	async function loadCalculation(id: string) {
		if (!id || !$user) return;
		
		loading = true;
		error = null;

		try {
			const calculation = await historyService.getCalculation(id, $user.uid);

			if (!calculation) {
				error = 'Calculation not found';
				return;
			}

			savedCalculation = calculation;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load calculation';
		} finally {
			loading = false;
		}
	}

	function handleBack() {
		goto('/history');
	}
</script>

<svelte:head>
	<title>View Calculation - NDC Calculator</title>
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
	<Button variant="ghost" on:click={handleBack} class="mb-6">
		<ArrowLeft size={20} class="mr-2" />
		Back to History
	</Button>

	{#if loading}
		<LoadingState message="Loading calculation..." />
	{:else if error}
		<ErrorState message={error} onRetry={() => loadCalculation($page.params.id)} />
	{:else if savedCalculation}
		<ResultsCard
			result={savedCalculation.calculation}
			onNewCalculation={() => goto('/calculator')}
		/>
	{/if}
</div>

