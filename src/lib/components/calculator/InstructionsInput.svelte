<script lang="ts">
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { cn } from '$lib/utils/cn';
	import { validateInstructions, MEDICAL_ABBREVIATIONS } from '$lib/utils/calculator-validation';

	export let value: string = '';
	export let error: string | undefined = undefined;
	export let disabled: boolean = false;

	let validation: ReturnType<typeof validateInstructions> | null = null;

	function handleInput() {
		if (value.length >= 5) {
			validation = validateInstructions(value);
		} else {
			validation = null;
		}
	}
</script>

<div class="space-y-3">
	<Label for="instructions" class="text-base font-semibold">
		Instructions
		<span class="text-destructive">*</span>
	</Label>

	<Textarea
		id="instructions"
		placeholder="e.g., Take 2 tablets twice daily&#10;or&#10;Take 1 tablet BID"
		bind:value
		on:input={handleInput}
		{disabled}
		rows={4}
		class={cn('text-base resize-none', error && 'border-destructive focus-visible:ring-destructive')}
	/>

	{#if error}
		<p class="text-sm font-medium text-destructive">{error}</p>
	{:else if validation?.suggestions || validation?.warnings}
		<div class="space-y-3">
			{#if validation.suggestions}
				<div class="flex flex-wrap gap-2">
					{#each validation.suggestions as suggestion}
						<Badge variant="secondary" class="text-sm py-1">{suggestion}</Badge>
					{/each}
				</div>
			{/if}

			{#if validation.warnings}
				{#each validation.warnings as warning}
					<Alert variant="default">
						<AlertDescription class="text-sm">{warning}</AlertDescription>
					</Alert>
				{/each}
			{/if}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">
			Enter dosing instructions. Common abbreviations: BID (twice daily), TID (three times daily),
			QD (once daily)
		</p>
	{/if}

	<!-- Common abbreviations reference -->
	<details class="text-sm text-muted-foreground">
		<summary class="cursor-pointer hover:text-foreground font-medium">
			Common Medical Abbreviations
		</summary>
		<div class="mt-3 grid grid-cols-2 gap-3 p-4 bg-muted rounded-md">
			{#each Object.entries(MEDICAL_ABBREVIATIONS) as [abbr, meaning]}
				<div class="text-sm">
					<span class="font-semibold">{abbr}:</span>
					{meaning}
				</div>
			{/each}
		</div>
	</details>
</div>
