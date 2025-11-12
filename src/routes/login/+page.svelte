<script lang="ts">
	import LoginForm from '$lib/components/auth/LoginForm.svelte';
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
	<title>Sign In - NDC Calculator</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold mb-2">NDC Calculator</h1>
			<p class="text-muted-foreground">AI-powered packaging calculations for pharmacists</p>
		</div>
		<LoginForm />
	</div>
</div>
