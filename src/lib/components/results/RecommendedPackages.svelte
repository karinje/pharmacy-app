<script lang="ts">
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { PackageOptimization } from '$lib/types/openai';
	import type { NDCProduct } from '$lib/types/fda';

	export let optimization: PackageOptimization;
	export let products: NDCProduct[];

	function getProductDetails(ndc: string): NDCProduct | undefined {
		return products.find((p) => p.ndc === ndc);
	}

	function getRankBadge(rank: number): { variant: 'default' | 'secondary' | 'outline'; label: string } {
		if (rank === 1) return { variant: 'default', label: 'Best Option' };
		if (rank === 2) return { variant: 'secondary', label: 'Alternative' };
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
			{#each optimization.recommendedPackages as pkg}
				{@const product = getProductDetails(pkg.ndc)}
				{@const rankInfo = getRankBadge(pkg.rank)}

				<div class="border rounded-lg p-4">
					<div class="flex items-start justify-between mb-2">
						<div>
							<Badge variant={rankInfo.variant}>{rankInfo.label}</Badge>
							{#if !product?.isActive}
								<Badge variant="destructive" class="ml-2">Inactive NDC</Badge>
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

