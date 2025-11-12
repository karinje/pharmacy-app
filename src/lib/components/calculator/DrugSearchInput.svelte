<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { cn } from '$lib/utils/cn';

	export let value: string = '';
	export let error: string | undefined = undefined;
	export let disabled: boolean = false;

	let focused = false;
	let suggestions: string[] = [];

	// Common drug names for autocomplete (will be enhanced with API in later shards)
	const COMMON_DRUGS = [
		'Metformin 500mg',
		'Metformin 850mg',
		'Metformin 1000mg',
		'Lisinopril 10mg',
		'Lisinopril 20mg',
		'Atorvastatin 10mg',
		'Atorvastatin 20mg',
		'Atorvastatin 40mg',
		'Levothyroxine 25mcg',
		'Levothyroxine 50mcg',
		'Amlodipine 5mg',
		'Amlodipine 10mg'
	];

	function handleInput() {
		if (value.length >= 2) {
			suggestions = COMMON_DRUGS.filter((drug) =>
				drug.toLowerCase().includes(value.toLowerCase())
			).slice(0, 5);
		} else {
			suggestions = [];
		}
	}

	function selectSuggestion(drug: string) {
		value = drug;
		suggestions = [];
		focused = false;
	}

	function handleBlur() {
		// Delay to allow click on suggestion
		setTimeout(() => {
			focused = false;
			suggestions = [];
		}, 200);
	}
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
			on:input={handleInput}
			on:focus={() => (focused = true)}
			on:blur={handleBlur}
			{disabled}
			class={cn('text-base h-12', error && 'border-destructive focus-visible:ring-destructive')}
		/>

		{#if focused && suggestions.length > 0}
			<div
				class="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
			>
				{#each suggestions as suggestion}
					<button
						type="button"
						class="w-full px-4 py-3 text-left text-base hover:bg-accent hover:text-accent-foreground cursor-pointer"
						on:click={() => selectSuggestion(suggestion)}
					>
						{suggestion}
					</button>
				{/each}
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
