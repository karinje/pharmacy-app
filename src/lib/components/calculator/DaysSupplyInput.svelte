<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils/cn';

	export let value: number = 30;
	export let error: string | undefined = undefined;
	export let disabled: boolean = false;

	const COMMON_SUPPLIES = [7, 14, 30, 60, 90];

	function setQuickValue(days: number) {
		value = days;
	}
</script>

<div class="space-y-3">
	<Label for="days-supply" class="text-base font-semibold">
		Days Supply
		<span class="text-destructive">*</span>
	</Label>

	<div class="flex gap-3 items-center">
		<Input
			id="days-supply"
			type="number"
			min="1"
			max="365"
			bind:value
			{disabled}
			class={cn('flex-1 text-base h-12', error && 'border-destructive focus-visible:ring-destructive')}
		/>
		<span class="text-base text-muted-foreground font-medium">days</span>
	</div>

	{#if error}
		<p class="text-sm font-medium text-destructive">{error}</p>
	{:else}
		<p class="text-sm text-muted-foreground">Number of days the prescription should last</p>
	{/if}

	<!-- Quick select buttons -->
	<div class="space-y-2">
		<span class="text-sm font-medium text-muted-foreground">Quick select:</span>
		<div class="flex flex-wrap gap-2">
			{#each COMMON_SUPPLIES as days}
				<Button
					type="button"
					variant={value === days ? 'default' : 'outline'}
					size="default"
					on:click={() => setQuickValue(days)}
					{disabled}
					class="min-w-[60px]"
				>
					{days}
				</Button>
			{/each}
		</div>
	</div>
</div>
