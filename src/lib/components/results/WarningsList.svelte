<script lang="ts">
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import type { Warning } from '$lib/types/calculation';
	import { AlertCircle, AlertTriangle, Info } from 'lucide-svelte';

	export let warnings: Warning[];

	function getIcon(severity: Warning['severity']) {
		if (severity === 'high') return AlertCircle;
		if (severity === 'medium') return AlertTriangle;
		return Info;
	}

	function getVariant(severity: Warning['severity']): 'default' | 'destructive' {
		return severity === 'high' ? 'destructive' : 'default';
	}

	$: sortedWarnings = warnings.sort((a, b) => {
		const severityOrder = { high: 0, medium: 1, low: 2 };
		return severityOrder[a.severity] - severityOrder[b.severity];
	});
</script>

{#if warnings.length > 0}
	<div class="space-y-3">
		<h3 class="text-lg font-semibold">Warnings & Notes</h3>
		{#each sortedWarnings as warning}
			<Alert variant={getVariant(warning.severity)}>
				<svelte:component this={getIcon(warning.severity)} class="h-4 w-4" />
				<AlertTitle class="capitalize">{warning.severity} Priority</AlertTitle>
				<AlertDescription>{warning.message}</AlertDescription>
			</Alert>
		{/each}
	</div>
{/if}

