<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SearchBar from '$lib/components/history/SearchBar.svelte';
	import HistoryList from '$lib/components/history/HistoryList.svelte';
	import { Button } from '$lib/components/ui/button';
	import { historyStore, filteredHistory, isLoading } from '$lib/stores/history';
	import { historyService } from '$lib/services/history.service';
	import { user } from '$lib/stores/auth';
	import { Plus } from 'lucide-svelte';

	let searchQuery = '';
	let favoritesOnly = false;

	onMount(async () => {
		if ($user) {
			await loadHistory();
		}
	});

	async function loadHistory() {
		historyStore.setLoading(true);
		try {
			const calculations = await historyService.getUserHistory($user!.uid, {
				favoritesOnly
			});
			historyStore.setCalculations(calculations);
		} catch (error) {
			historyStore.setError(error instanceof Error ? error.message : 'Failed to load history');
		}
	}

	function handleView(id: string) {
		goto(`/history/${id}`);
	}

	async function handleToggleFavorite(id: string) {
		try {
			const newStatus = await historyService.toggleFavorite(id, $user!.uid);
			historyStore.updateCalculation(id, { isFavorite: newStatus });
		} catch (error) {
			console.error('Failed to toggle favorite:', error);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Are you sure you want to delete this calculation?')) {
			return;
		}

		try {
			await historyService.deleteCalculation(id, $user!.uid);
			historyStore.removeCalculation(id);
		} catch (error) {
			console.error('Failed to delete calculation:', error);
		}
	}

	function handleSearchChange(query: string) {
		searchQuery = query;
		historyStore.setSearchQuery(query);
	}

	function handleToggleFavorites() {
		favoritesOnly = !favoritesOnly;
		historyStore.toggleFavoritesFilter();
		loadHistory();
	}
</script>

<svelte:head>
	<title>History - NDC Calculator</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold">Calculation History</h1>
			<p class="text-muted-foreground mt-2">View and manage your past calculations</p>
		</div>
		<Button on:click={() => goto('/calculator')}>
			<Plus size={20} class="mr-2" />
			New Calculation
		</Button>
	</div>

	<div class="mb-6">
		<SearchBar
			{searchQuery}
			{favoritesOnly}
			onSearchChange={handleSearchChange}
			onToggleFavorites={handleToggleFavorites}
		/>
	</div>

	<HistoryList
		calculations={$filteredHistory}
		loading={$isLoading}
		onView={handleView}
		onToggleFavorite={handleToggleFavorite}
		onDelete={handleDelete}
	/>
</div>
