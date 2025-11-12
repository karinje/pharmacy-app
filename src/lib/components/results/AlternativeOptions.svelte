<script lang="ts">
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import type { PackageOptimization } from '$lib/types/openai';

	export let optimization: PackageOptimization;
</script>

{#if optimization.alternatives.length > 0}
	<Card>
		<CardHeader>
			<h3 class="text-lg font-semibold">Alternative Options</h3>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				{#each optimization.alternatives as alt}
					<div class="border-l-4 border-primary pl-4">
						<h4 class="font-medium mb-2">{alt.description}</h4>

						<div class="space-y-2 text-sm">
							<div>
								<p class="font-medium text-muted-foreground">Packages:</p>
								<ul class="list-disc list-inside">
									{#each alt.packages as pkg}
										<li>{pkg.quantity}× NDC {pkg.ndc}</li>
									{/each}
								</ul>
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

