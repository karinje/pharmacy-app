<script lang="ts">
  import AuthGuard from '$lib/components/auth/AuthGuard.svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import type { LayoutData } from './$types';

  // Accept params to avoid SvelteKit warning (even if unused)
  export let params: LayoutData['params'];
</script>

<AuthGuard>
  <div class="min-h-screen flex flex-col">
    <Header />
    <main class="flex-1">
      <slot />
    </main>
    <Footer />
  </div>
</AuthGuard>

