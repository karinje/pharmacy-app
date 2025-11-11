<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLAttributes } from 'svelte/elements';

  interface $$Props extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }

  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<div class={cn('p-6 pt-0', className)} {...$$restProps}>
  <slot />
</div>

