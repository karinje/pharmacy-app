<script lang="ts">
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Star, Trash2, FileText } from 'lucide-svelte';
	import type { SavedCalculation } from '$lib/services/history.service';

	export let calculation: SavedCalculation;
	export let onView: (id: string) => void;
	export let onToggleFavorite: (id: string) => void;
	export let onDelete: (id: string) => void;

	$: calc = calculation?.calculation;
	$: drugName = calc?.rxnormData?.name || '';
	$: totalQuantity = calc?.quantity?.totalQuantityNeeded || 0;
	$: recommendedNDC = calc?.optimization?.recommendedPackages?.[0]?.ndc;

	function handleToggleFavorite(event: MouseEvent) {
		event.stopPropagation();
		onToggleFavorite(calculation.id);
	}

	function handleDelete(event: MouseEvent) {
		event.stopPropagation();
		onDelete(calculation.id);
	}
</script>

{#if calculation && calc}
	<Card class="hover:shadow-md transition-shadow">
		<CardHeader>
			<div class="flex items-start justify-between">
				<div class="flex-1">
					<h3 class="font-semibold text-lg">{drugName}</h3>
					<p class="text-sm text-muted-foreground mt-1">{calc.input.instructions}</p>
				</div>
				<button on:click={handleToggleFavorite} class="ml-2">
					<Star
						class={calculation.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
						size={20}
					/>
				</button>
			</div>
		</CardHeader>

		<CardContent>
			<div class="space-y-3">
				<div class="flex flex-wrap gap-2">
					<Badge variant="secondary">{calc.input.daysSupply} days</Badge>
					<Badge variant="secondary">
						{totalQuantity} {calc.parsing.dosageUnit}s
					</Badge>
					{#if recommendedNDC}
						<Badge>NDC: {recommendedNDC}</Badge>
					{/if}
				</div>

				{#if calculation.notes}
					<p class="text-sm text-muted-foreground">{calculation.notes}</p>
				{/if}

				<div class="flex items-center justify-between pt-2">
					<p class="text-xs text-muted-foreground">
						{calculation.createdAt.toLocaleDateString()}
					</p>

					<div class="flex gap-2">
						<Button variant="outline" size="sm" on:click={() => onView(calculation.id)}>
							<FileText size={16} class="mr-1" />
							View
						</Button>
						<Button variant="outline" size="sm" on:click={handleDelete}>
							<Trash2 size={16} />
						</Button>
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
{/if}

