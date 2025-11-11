<script lang="ts">
  import { cn } from '$lib/utils/cn';

  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let className: string = '';

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
</script>

<div
  class={cn(
    'animate-spin rounded-full border-2 border-current border-t-transparent',
    sizes[size],
    className
  )}
  role="status"
  aria-label="Loading"
>
  <span class="sr-only">Loading...</span>
</div>

