<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { isAuthenticated } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		const unsubscribe = isAuthenticated.subscribe((authenticated) => {
			if (authenticated) {
				goto('/dashboard');
			}
		});

		return unsubscribe;
	});
</script>

<svelte:head>
	<title>NDC Calculator - AI-Powered Pharmacy Tool</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
	<!-- Hero Section -->
	<div class="container mx-auto px-4 py-16">
		<div class="max-w-4xl mx-auto text-center space-y-8">
			<!-- Header -->
			<div class="space-y-4">
				<Badge variant="secondary" class="mb-4">AI-Powered Solution</Badge>
				<h1 class="text-5xl md:text-6xl font-bold tracking-tight">
					NDC Package Calculator
				</h1>
				<p class="text-xl text-muted-foreground max-w-2xl mx-auto">
					Reduce calculation time from 15 minutes to 30 seconds with 95%+ accuracy. Intelligent
					packaging recommendations powered by AI.
				</p>
			</div>

			<!-- CTA Buttons -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
				<Button size="lg" class="w-full sm:w-auto" on:click={() => goto('/signup')}>
					Get Started Free
				</Button>
				<Button size="lg" variant="outline" class="w-full sm:w-auto" on:click={() => goto('/login')}>
					Sign In
				</Button>
			</div>

			<!-- Features Grid -->
			<div class="grid md:grid-cols-3 gap-6 mt-16">
				<Card>
					<CardContent class="pt-6">
						<div class="space-y-2">
							<div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
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
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
							</div>
							<h3 class="text-lg font-semibold">Lightning Fast</h3>
							<p class="text-sm text-muted-foreground">
								Get accurate NDC recommendations in seconds, not minutes
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="pt-6">
						<div class="space-y-2">
							<div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
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
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<h3 class="text-lg font-semibold">AI-Powered</h3>
							<p class="text-sm text-muted-foreground">
								Smart recommendations using OpenAI GPT-4 and FDA data
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent class="pt-6">
						<div class="space-y-2">
							<div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
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
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<h3 class="text-lg font-semibold">Secure & Private</h3>
							<p class="text-sm text-muted-foreground">
								HIPAA-compliant with Firebase authentication and encryption
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<!-- How It Works -->
			<div class="mt-20 space-y-8">
				<h2 class="text-3xl font-bold">How It Works</h2>
				<div class="grid md:grid-cols-3 gap-8 text-left">
					<div class="space-y-2">
						<div
							class="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-4"
						>
							1
						</div>
						<h3 class="text-lg font-semibold">Enter Prescription</h3>
						<p class="text-sm text-muted-foreground">
							Input drug name, instructions (SIG), and days supply
						</p>
					</div>
					<div class="space-y-2">
						<div
							class="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-4"
						>
							2
						</div>
						<h3 class="text-lg font-semibold">AI Analysis</h3>
						<p class="text-sm text-muted-foreground">
							Our AI parses instructions and queries FDA NDC database
						</p>
					</div>
					<div class="space-y-2">
						<div
							class="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-4"
						>
							3
						</div>
						<h3 class="text-lg font-semibold">Get Results</h3>
						<p class="text-sm text-muted-foreground">
							Receive optimal package recommendations with explanations
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Footer -->
	<div class="border-t mt-20">
		<div class="container mx-auto px-4 py-8">
			<p class="text-center text-sm text-muted-foreground">
				© 2025 Foundation Health. All rights reserved.
			</p>
		</div>
	</div>
</div>
