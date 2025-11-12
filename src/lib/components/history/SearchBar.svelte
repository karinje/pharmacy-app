<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Search, X, Star } from 'lucide-svelte';

	export let searchQuery: string = '';
	export let favoritesOnly: boolean = false;
	export let onSearchChange: (query: string) => void;
	export let onToggleFavorites: () => void;

	function clearSearch() {
		searchQuery = '';
		onSearchChange('');
	}
</script>

<div class="flex gap-2">
	<div class="relative flex-1">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
		<Input
			type="text"
			placeholder="Search calculations..."
			bind:value={searchQuery}
			on:input={() => onSearchChange(searchQuery)}
			class="pl-10 pr-10"
		/>
		{#if searchQuery}
			<button
				on:click={clearSearch}
				class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
			>
				<X size={20} />
			</button>
		{/if}
	</div>

	<Button variant={favoritesOnly ? 'default' : 'outline'} on:click={onToggleFavorites}>
		<Star size={20} class={favoritesOnly ? 'fill-current' : ''} />
	</Button>
</div>

