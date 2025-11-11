# SHARD 3: UI Component Library (shadcn-svelte)

## Status: 🔜 READY TO START

## Objective
Set up shadcn-svelte component library and create reusable UI components for the application.

## Dependencies
- ✅ Shard 1 (Project Foundation) - COMPLETE
- ✅ Shard 2 (Authentication) - COMPLETE

## Context from Shard 2

**Available Auth Components:**
- `LoginForm.svelte` - Login form component
- `SignupForm.svelte` - Signup form component
- `AuthGuard.svelte` - Route protection wrapper
- `Header.svelte` - App navigation header
- `Footer.svelte` - App footer

**Available Auth Services:**
- `authService` - Authentication operations (import from `$lib/services/auth.service`)
- `userService` - User document management (import from `$lib/services/user.service`)

**Available Auth Stores:**
- `authStore` - Main auth state store
- `user` - Derived store for current Firebase user
- `isAuthenticated` - Derived boolean store
- `isLoading` - Derived loading state store

**Available Utilities:**
- `validation.ts` - Zod schemas (loginSchema, signupSchema, emailSchema, passwordSchema)
- `errors.ts` - Error handling (AppError class, handleFirebaseError function)

**Current Routes:**
- `/` - Landing page (redirects to dashboard if authenticated)
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - Protected dashboard (inside `(authenticated)` group)

**Design System:**
- Tailwind CSS configured with CSS variables
- Primary color: `hsl(221.2 83.2% 53.3%)`
- All form inputs currently use basic Tailwind classes
- Ready to enhance with shadcn-svelte components

**What to Build:**
- Install and configure shadcn-svelte
- Create reusable UI components (Button, Input, Card, etc.)
- Refactor existing forms to use new components
- Build calculator-specific components

## Files to Create/Modify

```
src/
├── lib/
│   ├── components/
│   │   └── ui/
│   │       ├── button/
│   │       │   ├── button.svelte           # NEW: Button component
│   │       │   └── index.ts                # NEW: Button exports
│   │       ├── card/
│   │       │   ├── card.svelte             # NEW: Card component
│   │       │   ├── card-header.svelte      # NEW
│   │       │   ├── card-content.svelte     # NEW
│   │       │   ├── card-footer.svelte      # NEW
│   │       │   └── index.ts                # NEW
│   │       ├── input/
│   │       │   ├── input.svelte            # NEW: Input component
│   │       │   └── index.ts                # NEW
│   │       ├── label/
│   │       │   ├── label.svelte            # NEW: Label component
│   │       │   └── index.ts                # NEW
│   │       ├── textarea/
│   │       │   ├── textarea.svelte         # NEW: Textarea component
│   │       │   └── index.ts                # NEW
│   │       ├── alert/
│   │       │   ├── alert.svelte            # NEW: Alert component
│   │       │   ├── alert-title.svelte      # NEW
│   │       │   ├── alert-description.svelte # NEW
│   │       │   └── index.ts                # NEW
│   │       ├── badge/
│   │       │   ├── badge.svelte            # NEW: Badge component
│   │       │   └── index.ts                # NEW
│   │       ├── spinner/
│   │       │   ├── spinner.svelte          # NEW: Loading spinner
│   │       │   └── index.ts                # NEW
│   │       ├── skeleton/
│   │       │   ├── skeleton.svelte         # NEW: Skeleton loader
│   │       │   └── index.ts                # NEW
│   │       └── dialog/
│   │           ├── dialog.svelte           # NEW: Dialog/Modal
│   │           ├── dialog-content.svelte   # NEW
│   │           ├── dialog-header.svelte    # NEW
│   │           ├── dialog-footer.svelte    # NEW
│   │           └── index.ts                # NEW
│   └── utils/
│       ├── cn.ts                           # NEW: Class merge utility
│       └── transitions.ts                  # NEW: Svelte transitions
├── routes/
│   └── components-demo/                    # NEW: Component showcase
│       └── +page.svelte                    # NEW
└── tailwind.config.ts                      # MODIFY: Add component variants
```

## Implementation Details

### 1. Install shadcn-svelte Dependencies
```bash
npm install clsx tailwind-merge
npm install -D @tailwindcss/forms @tailwindcss/typography
npm install lucide-svelte  # Icons
npm install bits-ui        # Headless UI primitives
```

### 2. Class Name Utility (`src/lib/utils/cn.ts`)
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 3. Transition Utilities (`src/lib/utils/transitions.ts`)
```typescript
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export function flyAndScale(
  node: Element,
  params: {
    y?: number;
    x?: number;
    start?: number;
    duration?: number;
  } = {}
): TransitionConfig {
  const style = getComputedStyle(node);
  const transform = style.transform === 'none' ? '' : style.transform;

  const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (style: Record<string, number | string | undefined>): string => {
    return Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) return str;
      return str + `${key}:${style[key]};`;
    }, '');
  };

  return {
    duration: params.duration ?? 200,
    delay: 0,
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity: t
      });
    },
    easing: cubicOut
  };
}
```

### 4. Button Component (`src/lib/components/ui/button/button.svelte`)
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface $$Props extends HTMLButtonAttributes {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    class?: string;
  }

  export let variant: $$Props['variant'] = 'default';
  export let size: $$Props['size'] = 'default';
  let className: $$Props['class'] = undefined;
  export { className as class };

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline'
  };

  const sizes = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8',
    icon: 'h-10 w-10'
  };
</script>

<button
  class={cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className
  )}
  {...$$restProps}
  on:click
>
  <slot />
</button>
```

### 5. Card Components (`src/lib/components/ui/card/`)

**card.svelte:**
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLAttributes } from 'svelte/elements';

  interface $$Props extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }

  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<div
  class={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)}
  {...$$restProps}
>
  <slot />
</div>
```

**card-header.svelte:**
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLAttributes } from 'svelte/elements';

  interface $$Props extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }

  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<div class={cn('flex flex-col space-y-1.5 p-6', className)} {...$$restProps}>
  <slot />
</div>
```

**card-content.svelte:**
```svelte
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
```

**card-footer.svelte:**
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLAttributes} from 'svelte/elements';

  interface $$Props extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }

  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<div class={cn('flex items-center p-6 pt-0', className)} {...$$restProps}>
  <slot />
</div>
```

**index.ts:**
```typescript
import Root from './card.svelte';
import Content from './card-content.svelte';
import Footer from './card-footer.svelte';
import Header from './card-header.svelte';

export {
  Root,
  Content,
  Footer,
  Header,
  Root as Card,
  Content as CardContent,
  Footer as CardFooter,
  Header as CardHeader
};
```

### 6. Input Component (`src/lib/components/ui/input/input.svelte`)
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface $$Props extends HTMLInputAttributes {
    value?: string | number;
    class?: string;
  }

  export let value: $$Props['value'] = undefined;
  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<input
  bind:value
  class={cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...$$restProps}
  on:blur
  on:change
  on:click
  on:focus
  on:keydown
  on:keypress
  on:keyup
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:paste
  on:input
/>
```

### 7. Label Component (`src/lib/components/ui/label/label.svelte`)
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLLabelAttributes } from 'svelte/elements';

  interface $$Props extends HTMLLabelAttributes {
    class?: string;
  }

  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<label
  class={cn(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    className
  )}
  {...$$restProps}
>
  <slot />
</label>
```

### 8. Textarea Component (`src/lib/components/ui/textarea/textarea.svelte`)
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  interface $$Props extends HTMLTextareaAttributes {
    value?: string;
    class?: string;
  }

  export let value: $$Props['value'] = undefined;
  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<textarea
  bind:value
  class={cn(
    'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  {...$$restProps}
  on:blur
  on:change
  on:click
  on:focus
  on:keydown
  on:keypress
  on:keyup
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:paste
  on:input
/>
```

### 9. Alert Components (`src/lib/components/ui/alert/`)

**alert.svelte:**
```svelte
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
```

**alert-title.svelte:**
```svelte
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
```

**alert-description.svelte:**
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLAttributes } from 'svelte/elements';

  interface $$Props extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }

  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<div class={cn('text-sm [&_p]:leading-relaxed', className)} {...$$restProps}>
  <slot />
</div>
```

### 10. Badge Component (`src/lib/components/ui/badge/badge.svelte`)
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLAttributes } from 'svelte/elements';

  interface $$Props extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    class?: string;
  }

  export let variant: $$Props['variant'] = 'default';
  let className: $$Props['class'] = undefined;
  export { className as class };

  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground'
  };
</script>

<div
  class={cn(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    variants[variant],
    className
  )}
  {...$$restProps}
>
  <slot />
</div>
```

### 11. Spinner Component (`src/lib/components/ui/spinner/spinner.svelte`)
```svelte
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
```

### 12. Skeleton Component (`src/lib/components/ui/skeleton/skeleton.svelte`)
```svelte
<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import type { HTMLAttributes } from 'svelte/elements';

  interface $$Props extends HTMLAttributes<HTMLDivElement> {
    class?: string;
  }

  let className: $$Props['class'] = undefined;
  export { className as class };
</script>

<div class={cn('animate-pulse rounded-md bg-muted', className)} {...$$restProps} />
```

### 13. Component Demo Page (`src/routes/components-demo/+page.svelte`)
```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardHeader, CardContent, CardFooter } from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Spinner } from '$lib/components/ui/spinner';
  import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<svelte:head>
  <title>Component Demo - NDC Calculator</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
  <div>
    <h1 class="text-3xl font-bold mb-2">UI Components Demo</h1>
    <p class="text-muted-foreground">Showcase of all available UI components</p>
  </div>

  <!-- Buttons -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Buttons</h2>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-4">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      <div class="flex flex-wrap gap-4 mt-4">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>
    </CardContent>
  </Card>

  <!-- Inputs -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Inputs</h2>
    </CardHeader>
    <CardContent>
      <div class="space-y-4 max-w-md">
        <div>
          <Label for="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <div>
          <Label for="message">Message</Label>
          <Textarea id="message" placeholder="Type your message here" />
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Alerts -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Alerts</h2>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <Alert>
          <AlertTitle>Info Alert</AlertTitle>
          <AlertDescription>This is a default information alert.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Error Alert</AlertTitle>
          <AlertDescription>This is a destructive error alert.</AlertDescription>
        </Alert>
      </div>
    </CardContent>
  </Card>

  <!-- Badges -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Badges</h2>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="outline">Outline</Badge>
      </div>
    </CardContent>
  </Card>

  <!-- Loading States -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Loading States</h2>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <div class="flex gap-4 items-center">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
        <div class="space-y-2">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-4 w-1/2" />
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- Cards -->
  <Card>
    <CardHeader>
      <h2 class="text-2xl font-semibold">Card Example</h2>
      <p class="text-sm text-muted-foreground">This is a card with header, content, and footer</p>
    </CardHeader>
    <CardContent>
      <p>This is the card content area. You can put any content here.</p>
    </CardContent>
    <CardFooter>
      <Button>Action</Button>
    </CardFooter>
  </Card>
</div>
```

## Validation Checklist

- [ ] All UI components render correctly
- [ ] Components are accessible (keyboard navigation, ARIA)
- [ ] Components respond to all variant props
- [ ] Components respond to size props where applicable
- [ ] Tailwind classes merge correctly
- [ ] Components work in both light and dark modes
- [ ] Demo page displays all components
- [ ] Components handle edge cases (empty content, etc.)

## Success Criteria

✅ Complete shadcn-svelte component library implemented  
✅ All components properly typed with TypeScript  
✅ Components follow shadcn design patterns  
✅ Demo page functional for testing  
✅ Tailwind merge utility working correctly

---
