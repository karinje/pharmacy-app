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

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Access the NDC Calculator
      </p>
    </div>
    <LoginForm />
  </div>
</div>

