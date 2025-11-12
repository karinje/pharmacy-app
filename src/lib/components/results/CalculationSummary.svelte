<script lang="ts">
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { CalculationResult } from '$lib/types/calculation';

	export let result: CalculationResult;
</script>

<Card>
	<CardHeader>
		<h3 class="text-lg font-semibold">Calculation Summary</h3>
	</CardHeader>
	<CardContent>
		<div class="grid grid-cols-2 gap-4">
			<div>
				<p class="text-sm text-muted-foreground">Drug</p>
				<p class="font-medium">{result.rxnormData.name}</p>
				<Badge variant="secondary" class="mt-1">
					RxCUI: {result.rxnormData.rxcui}
				</Badge>
			</div>

			<div>
				<p class="text-sm text-muted-foreground">Instructions</p>
				<p class="font-medium">{result.input.instructions}</p>
			</div>

			<div>
				<p class="text-sm text-muted-foreground">Days Supply</p>
				<p class="font-medium">{result.input.daysSupply} days</p>
			</div>

			<div>
				<p class="text-sm text-muted-foreground">Total Quantity Needed</p>
				<p class="font-medium text-2xl">{result.quantity.totalQuantityNeeded}</p>
				<p class="text-sm text-muted-foreground">
					{result.parsing.dosageUnit}s
				</p>
			</div>

			<div class="col-span-2">
				<p class="text-sm text-muted-foreground">Calculation</p>
				<p class="text-sm">{result.quantity.calculation}</p>
			</div>
		</div>
	</CardContent>
</Card>

