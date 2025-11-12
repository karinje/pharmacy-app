<script lang="ts">
	import { user } from '$lib/stores/auth';
	import { Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Dashboard - NDC Calculator</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- Welcome Section -->
	<div class="mb-8">
		<h1 class="text-4xl font-bold mb-2">
			Welcome back{$user?.displayName ? `, ${$user.displayName}` : ''}! 👋
		</h1>
		<p class="text-lg text-muted-foreground">Ready to calculate NDC packages?</p>
	</div>

	<!-- Quick Actions -->
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
		<!-- New Calculation Card -->
		<Card class="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
			<CardHeader>
				<div
					class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4"
				>
					<svg
						class="w-6 h-6 text-primary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4v16m8-8H4"
						/>
					</svg>
				</div>
				<h3 class="text-2xl font-bold">New Calculation</h3>
			</CardHeader>
			<CardContent>
				<p class="text-muted-foreground mb-4">
					Start a new NDC package calculation with AI-powered recommendations
				</p>
			</CardContent>
			<CardFooter>
				<Button class="w-full" on:click={() => goto('/calculator')}>
					Start Calculating
					<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</Button>
			</CardFooter>
		</Card>

		<!-- History Card -->
		<Card class="hover:shadow-lg transition-shadow cursor-pointer">
			<CardHeader>
				<div
					class="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4"
				>
					<svg
						class="w-6 h-6 text-secondary-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3 class="text-2xl font-bold">View History</h3>
			</CardHeader>
			<CardContent>
				<p class="text-muted-foreground mb-4">
					Browse and review your past calculations and recommendations
				</p>
			</CardContent>
			<CardFooter>
				<Button variant="outline" class="w-full" on:click={() => goto('/history')}>
					View History
					<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</Button>
			</CardFooter>
		</Card>

		<!-- Quick Stats Card -->
		<Card class="bg-gradient-to-br from-primary/5 to-primary/10">
			<CardHeader>
				<div
					class="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4"
				>
					<svg
						class="w-6 h-6 text-primary"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
				<h3 class="text-2xl font-bold">Quick Stats</h3>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="flex justify-between items-center">
						<span class="text-muted-foreground">Total Calculations</span>
						<Badge variant="secondary" class="text-lg px-3 py-1">0</Badge>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-muted-foreground">This Month</span>
						<Badge variant="secondary" class="text-lg px-3 py-1">0</Badge>
					</div>
					<div class="flex justify-between items-center">
						<span class="text-muted-foreground">Time Saved</span>
						<Badge variant="secondary" class="text-lg px-3 py-1">0 min</Badge>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Features Section -->
	<div class="mb-8">
		<h2 class="text-2xl font-bold mb-4">What You Can Do</h2>
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardContent class="pt-6">
					<div class="flex items-start space-x-3">
						<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
							<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<div>
							<h4 class="font-semibold mb-1">Drug Lookup</h4>
							<p class="text-sm text-muted-foreground">Search drugs using RxNorm database</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="flex items-start space-x-3">
						<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
							<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						</div>
						<div>
							<h4 class="font-semibold mb-1">SIG Parsing</h4>
							<p class="text-sm text-muted-foreground">Intelligent instruction parsing</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="flex items-start space-x-3">
						<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
							<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
							</svg>
						</div>
						<div>
							<h4 class="font-semibold mb-1">Package Optimization</h4>
							<p class="text-sm text-muted-foreground">Minimize waste and cost</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="flex items-start space-x-3">
						<div class="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
							<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<div>
							<h4 class="font-semibold mb-1">AI Recommendations</h4>
							<p class="text-sm text-muted-foreground">GPT-4 powered suggestions</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>

	<!-- Getting Started Guide -->
	<Card class="bg-gradient-to-br from-muted/50 to-muted/30">
		<CardHeader>
			<h2 class="text-2xl font-bold">Getting Started</h2>
			<p class="text-muted-foreground">Follow these steps to make your first calculation</p>
		</CardHeader>
		<CardContent>
			<div class="space-y-4">
				<div class="flex items-start space-x-4">
					<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
						1
					</div>
					<div>
						<h4 class="font-semibold mb-1">Click "New Calculation"</h4>
						<p class="text-sm text-muted-foreground">Start by clicking the button above or in the navigation</p>
					</div>
				</div>
				<div class="flex items-start space-x-4">
					<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
						2
					</div>
					<div>
						<h4 class="font-semibold mb-1">Enter Prescription Details</h4>
						<p class="text-sm text-muted-foreground">Input drug name, instructions (e.g., "Take 1 tablet BID"), and days supply</p>
					</div>
				</div>
				<div class="flex items-start space-x-4">
					<div class="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold flex-shrink-0">
						3
					</div>
					<div>
						<h4 class="font-semibold mb-1">Get AI-Powered Results</h4>
						<p class="text-sm text-muted-foreground">Receive optimal NDC package recommendations with detailed explanations</p>
					</div>
				</div>
			</div>
		</CardContent>
		<CardFooter>
			<Button variant="default" class="w-full md:w-auto" on:click={() => goto('/calculator')}>
				Start Your First Calculation
			</Button>
		</CardFooter>
	</Card>
</div>
