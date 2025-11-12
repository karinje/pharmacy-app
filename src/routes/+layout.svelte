<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import type { LayoutData, LayoutProps } from './$types';
  
  // Suppress SvelteKit params warning
  export let data: LayoutData;
  export let params: LayoutProps['params'];
  
  onMount(() => {
    console.log('NDC Calculator initialized');
  });
</script>

<slot />

