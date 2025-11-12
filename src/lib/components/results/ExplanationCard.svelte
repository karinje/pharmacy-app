<script lang="ts">
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Lightbulb } from 'lucide-svelte';

	export let explanation: string;
</script>

<Card>
	<CardHeader>
		<div class="flex items-center gap-2">
			<Lightbulb class="h-5 w-5 text-primary" />
			<h3 class="text-lg font-semibold">AI Explanation</h3>
		</div>
	</CardHeader>
	<CardContent>
		<p class="text-sm leading-relaxed whitespace-pre-line">{explanation}</p>
	</CardContent>
</Card>

