<script lang="ts">
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { PackageOptimization } from '$lib/types/openai';
	import type { NDCProduct } from '$lib/types/fda';

	export let optimization: PackageOptimization;
	export let products: NDCProduct[];
	export let totalQuantityNeeded: number;

	function getProductDetails(ndc: string): NDCProduct | undefined {
		return products.find((p) => p.ndc === ndc);
	}

	// Calculate total bottles for a package recommendation
	function getTotalBottles(pkg: PackageOptimization['recommendedPackages'][0]): number {
		return pkg.quantity;
	}

	// Sort packages by: 1) meets quantity, 2) least waste, 3) minimum bottles
	$: sortedPackages = [...optimization.recommendedPackages].sort((a, b) => {
		// 1. Must meet or exceed required quantity
		const aMeets = a.totalUnits >= totalQuantityNeeded;
		const bMeets = b.totalUnits >= totalQuantityNeeded;
		if (aMeets !== bMeets) {
			return aMeets ? -1 : 1; // Meets requirement comes first
		}

		// 2. If both meet, sort by least waste (wasteUnits, then wastePercentage)
		if (aMeets && bMeets) {
			if (a.wasteUnits !== b.wasteUnits) {
				return a.wasteUnits - b.wasteUnits; // Less waste first
			}
			if (a.wastePercentage !== b.wastePercentage) {
				return a.wastePercentage - b.wastePercentage; // Less waste % first
			}
		}

		// 3. If waste is equal, sort by minimum bottles
		const aBottles = getTotalBottles(a);
		const bBottles = getTotalBottles(b);
		return aBottles - bBottles; // Fewer bottles first
	});

	function getRankBadge(index: number): { variant: 'default' | 'secondary' | 'outline'; label: string } {
		if (index === 0) return { variant: 'default', label: 'Best Option' };
		if (index === 1) return { variant: 'secondary', label: 'Alternative' };
		return { variant: 'outline', label: 'Option' };
	}
</script>

<Card>
	<CardHeader>
		<h3 class="text-lg font-semibold">Recommended Packages</h3>
		<p class="text-sm text-muted-foreground">{optimization.reasoning}</p>
	</CardHeader>
	<CardContent>
		<div class="space-y-4">
			{#each sortedPackages as pkg, index}
				{@const product = getProductDetails(pkg.ndc)}
				{@const rankInfo = getRankBadge(index)}
				{@const meetsRequirement = pkg.totalUnits >= totalQuantityNeeded}

				<div class="border rounded-lg p-4">
					<div class="flex items-start justify-between mb-2">
						<div>
							<Badge variant={rankInfo.variant}>{rankInfo.label}</Badge>
							{#if !product?.isActive}
								<Badge variant="destructive" class="ml-2">Inactive NDC</Badge>
							{/if}
							{#if !meetsRequirement}
								<Badge variant="destructive" class="ml-2">Insufficient Quantity</Badge>
							{/if}
						</div>
						<div class="text-right">
							<p class="text-sm text-muted-foreground">Waste</p>
							<p class="font-semibold text-lg">
								{pkg.wastePercentage.toFixed(1)}%
							</p>
						</div>
					</div>

					<div class="space-y-2">
						<div>
							<p class="font-medium">NDC: {pkg.ndc}</p>
							{#if product}
								<p class="text-sm text-muted-foreground">
									{product.manufacturer}
								</p>
								<p class="text-sm">
									{product.packageDescription}
								</p>
							{/if}
						</div>

						<div class="grid grid-cols-3 gap-4 text-sm">
							<div>
								<p class="text-muted-foreground">Quantity</p>
								<p class="font-medium">{pkg.quantity} bottle{pkg.quantity > 1 ? 's' : ''}</p>
							</div>
							<div>
								<p class="text-muted-foreground">Total Units</p>
								<p class="font-medium">{pkg.totalUnits}</p>
							</div>
							<div>
								<p class="text-muted-foreground">Waste Units</p>
								<p class="font-medium">{pkg.wasteUnits}</p>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</CardContent>
</Card>

