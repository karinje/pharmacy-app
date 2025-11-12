<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';

	export let isSubmitting: boolean = false;
	export let isValid: boolean = false;
	export let onReset: () => void;
</script>

<div class="flex gap-4 justify-end pt-4">
	<Button type="button" variant="outline" size="lg" on:click={onReset} disabled={isSubmitting}>
		Clear
	</Button>

	<Button type="submit" size="lg" disabled={!isValid || isSubmitting} class="min-w-[140px]">
		{#if isSubmitting}
			<Spinner size="sm" className="mr-2" />
			Calculating...
		{:else}
			Calculate
		{/if}
	</Button>
</div>
