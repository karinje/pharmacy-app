<script lang="ts">
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';

	export let title: string = 'Something went wrong';
	export let message: string;
	export let onRetry: (() => void) | null = null;
</script>

<Alert variant="destructive" class="my-4">
	<AlertTitle>{title}</AlertTitle>
	<AlertDescription class="mt-2">
		<p>{message}</p>
		{#if onRetry}
			<Button variant="outline" size="sm" class="mt-4" on:click={onRetry}> Try Again </Button>
		{/if}
	</AlertDescription>
</Alert>

