<script lang="ts">
  import { APP_NAME } from '$lib/config/constants';
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
  <title>{APP_NAME}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center">
  <div class="max-w-md w-full text-center space-y-8 px-4">
    <div>
      <h1 class="text-4xl font-bold text-gray-900 mb-4">{APP_NAME}</h1>
      <p class="text-gray-600 mb-8">
        AI-powered NDC packaging and quantity calculator for pharmacists
      </p>
    </div>
    
    <div class="space-y-4">
      <a
        href="/login"
        class="block w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Sign In
      </a>
      <a
        href="/signup"
        class="block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Create Account
      </a>
    </div>
  </div>
</div>

