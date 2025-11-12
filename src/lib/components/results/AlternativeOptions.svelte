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

	function calculateAlternativeTotal(alt: PackageOptimization['alternatives'][0]): number {
		return alt.packages.reduce((total, pkg) => {
			const product = getProductDetails(pkg.ndc);
			if (product) {
				return total + product.packageSize * pkg.quantity;
			}
			return total;
		}, 0);
	}
</script>

{#if optimization.alternatives.length > 0}
	<Card>
		<CardHeader>
			<h3 class="text-lg font-semibold">Alternative Options</h3>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each optimization.alternatives as alt}
					{@const altTotal = calculateAlternativeTotal(alt)}
					{@const meetsRequirement = altTotal >= totalQuantityNeeded}
					<div class="border-l-4 border-primary pl-4">
						<div class="flex items-center gap-2 mb-2">
							<h4 class="font-medium">{alt.description}</h4>
							{#if !meetsRequirement}
								<Badge variant="destructive">Insufficient Quantity</Badge>
							{/if}
						</div>

						<div class="space-y-2 text-sm">
							<div>
								<p class="font-medium text-muted-foreground">Packages:</p>
								<ul class="list-disc list-inside">
									{#each alt.packages as pkg}
										{@const product = getProductDetails(pkg.ndc)}
										<li>
											{pkg.quantity}× NDC {pkg.ndc}
											{#if product}
												<span class="text-muted-foreground">
													({product.packageSize} units each = {product.packageSize * pkg.quantity} total)
												</span>
											{/if}
										</li>
									{/each}
								</ul>
								<p class="mt-1 font-medium">
									Total: {altTotal} units
									{#if meetsRequirement}
										<span class="text-green-600">(meets requirement of {totalQuantityNeeded})</span>
									{:else}
										<span class="text-red-600">(needs {totalQuantityNeeded - altTotal} more)</span>
									{/if}
								</p>
							</div>

							<div class="grid grid-cols-2 gap-4">
								<div>
									<p class="font-medium text-green-600">Pros:</p>
									<ul class="list-disc list-inside">
										{#each alt.pros as pro}
											<li class="text-muted-foreground">{pro}</li>
										{/each}
									</ul>
								</div>

								<div>
									<p class="font-medium text-red-600">Cons:</p>
									<ul class="list-disc list-inside">
										{#each alt.cons as con}
											<li class="text-muted-foreground">{con}</li>
										{/each}
										{#if !meetsRequirement}
											<li class="text-red-600 font-medium">
												Does not meet required quantity
											</li>
										{/if}
									</ul>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
{/if}

