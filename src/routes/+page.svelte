<script lang="ts">
  import { APP_NAME } from '$lib/config/constants';
</script>

<svelte:head>
  <title>{APP_NAME}</title>
</svelte:head>

<div class="min-h-screen bg-background">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-4">{APP_NAME}</h1>
    <p class="text-muted-foreground">Project foundation initialized successfully.</p>
  </div>
</div>

