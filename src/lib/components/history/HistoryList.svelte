<script lang="ts">
	import HistoryCard from './HistoryCard.svelte';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { SavedCalculation } from '$lib/services/history.service';

	export let calculations: SavedCalculation[];
	export let loading: boolean = false;
	export let onView: (id: string) => void;
	export let onToggleFavorite: (id: string) => void;
	export let onDelete: (id: string) => void;
</script>

{#if loading}
	<div class="space-y-4">
		{#each Array(3) as _}
			<Skeleton class="h-48 w-full" />
		{/each}
	</div>
{:else if calculations.length === 0}
	<Alert>
		<AlertDescription>
			No calculations found. Start by creating a new calculation!
		</AlertDescription>
	</Alert>
{:else}
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each calculations as calculation (calculation.id)}
			<HistoryCard
				{calculation}
				{onView}
				{onToggleFavorite}
				{onDelete}
			/>
		{/each}
	</div>
{/if}

