<script lang="ts">
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
</script>

<svelte:head>
	<title>History - NDC Calculator</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">Calculation History</h1>
		<p class="text-lg text-muted-foreground">View and manage your past calculations</p>
	</div>

	<!-- Empty State -->
	<Card class="text-center py-12">
		<CardContent>
			<div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold mb-2">No calculations yet</h3>
			<p class="text-muted-foreground mb-6">
				Start your first calculation to see your history here
			</p>
			<Badge variant="secondary">Coming in Shard 10</Badge>
		</CardContent>
	</Card>
</div>

