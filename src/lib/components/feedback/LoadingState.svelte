<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';

	export let message: string = 'Processing your request...';
</script>

<Card>
	<CardContent class="flex flex-col items-center justify-center py-12">
		<Spinner size="lg" className="mb-4" />
		<p class="text-lg font-medium">{message}</p>
		<p class="text-sm text-muted-foreground mt-2">This may take a few seconds</p>
	</CardContent>
</Card>

