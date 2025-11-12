<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils/cn';
	import { rxnormService } from '$lib/services/rxnorm.service';
	import type { RxNormCandidate } from '$lib/types/rxnorm';
	import { onDestroy, createEventDispatcher } from 'svelte';

	export let value: string = '';
	export let error: string | undefined = undefined;
	export let disabled: boolean = false;

	const dispatch = createEventDispatcher<{
		rxcuiSelected: { rxcui: string; name: string };
		drugNameChanged: void;
	}>();

	let focused = false;
	let suggestions: RxNormCandidate[] = [];
	let loading = false;
	let searchTimeout: ReturnType<typeof setTimeout> | null = null;
	let loadingTimeout: ReturnType<typeof setTimeout> | null = null;
	let currentSearchTerm = '';
	let lastGoodSearchTerm = ''; // Track the last search that returned results

	async function handleInput() {
		// Clear previous timeout
		if (searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = null;
		}

		// Require at least 3 characters to search
		// Note: Some 3-char queries may return 0 results, but we handle that gracefully
		if (value.length < 3) {
			suggestions = [];
			loading = false;
			currentSearchTerm = '';
			lastGoodSearchTerm = '';
			return;
		}

		const searchTerm = value.trim();
		
		// Clear any existing loading timeout
		if (loadingTimeout) {
			clearTimeout(loadingTimeout);
			loadingTimeout = null;
		}
		
		// If search term changed, cancel previous search
		if (currentSearchTerm && currentSearchTerm !== searchTerm) {
			loading = false;
		}
		
		currentSearchTerm = searchTerm;
		loading = true;

		// Safety timeout - clear loading after 10 seconds max
		loadingTimeout = setTimeout(() => {
			if (loading && currentSearchTerm === searchTerm) {
				console.warn('Search timeout, clearing loading state');
				loading = false;
			}
		}, 10000);

		// Debounce API calls - reduced to 300ms for better responsiveness
		searchTimeout = setTimeout(async () => {
			// Check if search term changed during debounce
			if (currentSearchTerm !== searchTerm) {
				console.log('Search term changed, skipping:', searchTerm);
				loading = false;
				if (loadingTimeout) {
					clearTimeout(loadingTimeout);
					loadingTimeout = null;
				}
				return;
			}

			try {
				console.log('Searching for:', searchTerm);
				const results = await rxnormService.searchDrugs(searchTerm, 10);
				console.log('Search results:', results.length, 'items for:', searchTerm);
				
				// Clear loading timeout
				if (loadingTimeout) {
					clearTimeout(loadingTimeout);
					loadingTimeout = null;
				}
				
				// Only update if this is still the current search term
				if (currentSearchTerm === searchTerm) {
					if (results.length > 0) {
						// We have results - always update
						suggestions = results;
						lastGoodSearchTerm = searchTerm;
						console.log('Updated suggestions with', results.length, 'items');
					} else {
						// No results - be smart about when to clear
						if (lastGoodSearchTerm.length === 0) {
							// First search, no previous good results - clear
							suggestions = [];
							console.log('First search returned empty, clearing');
						} else if (searchTerm.length < lastGoodSearchTerm.length) {
							// User is deleting back - keep good results
							console.log('Keeping existing suggestions - user deleted back');
						} else if (searchTerm.startsWith(lastGoodSearchTerm)) {
							// User is extending the good search term - keep results (they're still relevant)
							console.log('Keeping existing suggestions - extending good term');
						} else {
							// Completely different term, longer than last good - clear
							suggestions = [];
							console.log('Clearing suggestions - new longer term with no results');
						}
					}
					loading = false;
				} else {
					console.log('Search term changed, ignoring results for:', searchTerm);
					loading = false;
				}
			} catch (err) {
				console.error('Failed to search drugs:', err);
				// Clear loading timeout
				if (loadingTimeout) {
					clearTimeout(loadingTimeout);
					loadingTimeout = null;
				}
				// Only clear if this is still the current search
				if (currentSearchTerm === searchTerm) {
					suggestions = [];
					loading = false;
				}
			}
		}, 300);
	}

	function selectSuggestion(candidate: RxNormCandidate) {
		value = candidate.name;
		suggestions = [];
		focused = false;
		loading = false;
		
		// Emit RxCUI if available (from CTSS or RxNorm)
		if (candidate.rxcui) {
			dispatch('rxcuiSelected', {
				rxcui: candidate.rxcui,
				name: candidate.name
			});
		}
	}

	function handleBlur() {
		// Delay to allow click on suggestion
		setTimeout(() => {
			focused = false;
			suggestions = [];
		}, 200);
	}

	onDestroy(() => {
		if (searchTimeout) {
			clearTimeout(searchTimeout);
		}
		if (loadingTimeout) {
			clearTimeout(loadingTimeout);
		}
	});
</script>

<div class="space-y-3">
	<Label for="drug-name" class="text-base font-semibold">
		Drug Name
		<span class="text-destructive">*</span>
	</Label>

	<div class="relative">
		<Input
			id="drug-name"
			type="text"
			placeholder="e.g., Metformin 500mg"
			bind:value
			on:input={() => {
				handleInput();
				// Clear RxCUI when user manually edits (not from autocomplete)
				dispatch('drugNameChanged');
			}}
			on:focus={() => (focused = true)}
			on:blur={handleBlur}
			{disabled}
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
			class={cn('text-base h-12', error && 'border-destructive focus-visible:ring-destructive')}
		/>

		{#if focused && (suggestions.length > 0 || loading)}
			<div
				class="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
			>
				{#if loading}
					<div class="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
				{:else if suggestions.length > 0}
					{#each suggestions as candidate}
						<button
							type="button"
							class="w-full px-4 py-3 text-left text-base hover:bg-accent hover:text-accent-foreground cursor-pointer flex flex-col"
							on:click={() => selectSuggestion(candidate)}
						>
							<span class="font-medium">{candidate.name}</span>
							{#if candidate.score}
								<span class="text-xs text-muted-foreground">
									Match: {candidate.score}%
								</span>
							{/if}
						</button>
					{/each}
				{:else if value.length >= 3 && lastGoodSearchTerm.length > 0}
					<div class="px-4 py-3 text-sm text-muted-foreground">No results found</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if error}
		<p class="text-sm font-medium text-destructive">{error}</p>
	{:else}
		<p class="text-sm text-muted-foreground">
			Enter the drug name and strength (e.g., Metformin 500mg)
		</p>
	{/if}
</div>
