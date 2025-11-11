<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLAttributes } from 'svelte/elements';

  interface $$Props extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive';
    class?: string;
  }

  export let variant: $$Props['variant'] = 'default';
  let className: $$Props['class'] = undefined;
  export { className as class };

  const variants = {
    default: 'bg-background text-foreground',
    destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
  };
</script>

<div
  class={cn(
    'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
    variants[variant],
    className
  )}
  {...$$restProps}
  role="alert"
>
  <slot />
</div>

