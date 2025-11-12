<script lang="ts">
  import AuthGuard from '$lib/components/auth/AuthGuard.svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import type { LayoutProps } from './$types';
  
  // Suppress SvelteKit params warning
  export let params: LayoutProps['params'];
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

