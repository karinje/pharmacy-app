<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLAttributes } from 'svelte/elements';

  interface $$Props extends HTMLAttributes<HTMLHeadingElement> {
    class?: string;
  }

  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<h5 class={cn('mb-1 font-medium leading-none tracking-tight', className)} {...$$restProps}>
  <slot />
</h5>

