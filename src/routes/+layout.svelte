<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  
  onMount(() => {
    console.log('NDC Calculator initialized');
  });
</script>

<slot />

