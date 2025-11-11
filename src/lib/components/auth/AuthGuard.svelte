<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';

  let initialized = false;

  onMount(() => {
    const unsubscribe = authStore.subscribe((state) => {
      if (state.initialized) {
        initialized = true;
        if (!state.user) {
          goto('/login');
        }
      }
    });

    return unsubscribe;
  });
</script>

{#if initialized}
  <slot />
{:else}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
{/if}

