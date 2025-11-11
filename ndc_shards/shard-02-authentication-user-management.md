# SHARD 2: Authentication & User Management

## Objective
Implement complete authentication system with Firebase Auth, including signup, login, logout, and user session management.

## Dependencies
- Shard 1 (Project Foundation)

## Files to Create/Modify

```
src/
├── lib/
│   ├── stores/
│   │   ├── auth.ts                    # NEW: Auth state store
│   │   └── user.ts                    # NEW: User data store
│   ├── services/
│   │   ├── auth.service.ts            # NEW: Authentication service
│   │   └── user.service.ts            # NEW: User management service
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.svelte       # NEW: Login form component
│   │   │   ├── SignupForm.svelte      # NEW: Signup form component
│   │   │   └── AuthGuard.svelte       # NEW: Route protection component
│   │   └── layout/
│   │       ├── Header.svelte          # NEW: App header with user menu
│   │       └── Footer.svelte          # NEW: App footer
│   └── utils/
│       ├── validation.ts              # NEW: Form validation helpers
│       └── errors.ts                  # NEW: Error handling utilities
├── routes/
│   ├── +layout.svelte                 # MODIFY: Add auth state
│   ├── +layout.ts                     # NEW: Load auth state
│   ├── +page.svelte                   # MODIFY: Landing page
│   ├── login/
│   │   └── +page.svelte               # NEW: Login page
│   ├── signup/
│   │   └── +page.svelte               # NEW: Signup page
│   └── (authenticated)/               # NEW: Protected routes group
│       ├── +layout.svelte             # NEW: Auth-required layout
│       ├── +layout.ts                 # NEW: Auth guard
│       └── dashboard/
│           └── +page.svelte           # NEW: Dashboard page
└── hooks.server.ts                    # MODIFY: Add auth hooks
```

## Implementation Details

### 1. Auth State Store (`src/lib/stores/auth.ts`)
```typescript
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { auth } from '$lib/config/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  initialized: boolean;
}

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: true,
    initialized: false
  });

  if (browser) {
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, (user) => {
      update((state) => ({
        user,
        loading: false,
        initialized: true
      }));
    });
  }

  return {
    subscribe,
    setUser: (user: FirebaseUser | null) => update((state) => ({ ...state, user })),
    setLoading: (loading: boolean) => update((state) => ({ ...state, loading }))
  };
}

export const authStore = createAuthStore();

// Derived stores for convenience
export const user = derived(authStore, ($auth) => $auth.user);
export const isAuthenticated = derived(authStore, ($auth) => !!$auth.user);
export const isLoading = derived(authStore, ($auth) => $auth.loading);
```

### 2. Authentication Service (`src/lib/services/auth.service.ts`)
```typescript
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  type UserCredential
} from 'firebase/auth';
import { auth } from '$lib/config/firebase';
import { userService } from './user.service';
import { handleFirebaseError } from '$lib/utils/errors';

class AuthService {
  /**
   * Sign up a new user
   */
  async signup(email: string, password: string, displayName?: string): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }

      // Create user document in Firestore
      await userService.createUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: displayName,
        role: 'pharmacist',
        createdAt: new Date(),
        lastLoginAt: new Date()
      });

      return userCredential;
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  /**
   * Sign in existing user
   */
  async login(email: string, password: string): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login time
      await userService.updateLastLogin(userCredential.user.uid);
      
      return userCredential;
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw handleFirebaseError(error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth.currentUser;
  }
}

export const authService = new AuthService();
```

### 3. User Service (`src/lib/services/user.service.ts`)
```typescript
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '$lib/config/firebase';
import type { User } from '$lib/types';

class UserService {
  private readonly COLLECTION = 'users';

  /**
   * Create new user document
   */
  async createUser(user: Omit<User, 'createdAt' | 'lastLoginAt'> & { createdAt: Date; lastLoginAt: Date }): Promise<void> {
    const userRef = doc(db, this.COLLECTION, user.uid);
    await setDoc(userRef, {
      ...user,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    });
  }

  /**
   * Get user document
   */
  async getUser(uid: string): Promise<User | null> {
    const userRef = doc(db, this.COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return null;
    }

    return userSnap.data() as User;
  }

  /**
   * Update last login time
   */
  async updateLastLogin(uid: string): Promise<void> {
    const userRef = doc(db, this.COLLECTION, uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp()
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(uid: string, data: Partial<User>): Promise<void> {
    const userRef = doc(db, this.COLLECTION, uid);
    await updateDoc(userRef, data);
  }
}

export const userService = new UserService();
```

### 4. Validation Utilities (`src/lib/utils/validation.ts`)
```typescript
import { z } from 'zod';

// Email validation
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Login form validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// Signup form validation
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Name must be at least 2 characters').optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
```

### 5. Error Handling (`src/lib/utils/errors.ts`)
```typescript
import { FirebaseError } from 'firebase/app';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleFirebaseError(error: unknown): AppError {
  if (error instanceof FirebaseError) {
    const message = getFirebaseErrorMessage(error.code);
    return new AppError(message, error.code);
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('An unexpected error occurred');
}

function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/weak-password': 'Password is too weak',
    'auth/too-many-requests': 'Too many attempts. Please try again later',
    'auth/user-disabled': 'This account has been disabled',
    'auth/operation-not-allowed': 'Operation not allowed',
    'auth/network-request-failed': 'Network error. Please check your connection'
  };

  return messages[code] || 'An authentication error occurred';
}
```

### 6. Login Form Component (`src/lib/components/auth/LoginForm.svelte`)
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { authService } from '$lib/services/auth.service';
  import { loginSchema, type LoginFormData } from '$lib/utils/validation';
  import { AppError } from '$lib/utils/errors';

  let formData: LoginFormData = {
    email: '',
    password: ''
  };

  let errors: Partial<Record<keyof LoginFormData, string>> = {};
  let loading = false;
  let errorMessage = '';

  async function handleSubmit() {
    // Reset errors
    errors = {};
    errorMessage = '';
    loading = true;

    try {
      // Validate form
      const validated = loginSchema.parse(formData);

      // Attempt login
      await authService.login(validated.email, validated.password);

      // Redirect to dashboard
      await goto('/dashboard');
    } catch (error) {
      if (error instanceof AppError) {
        errorMessage = error.message;
      } else if (error.errors) {
        // Zod validation errors
        error.errors.forEach((err: any) => {
          errors[err.path[0]] = err.message;
        });
      } else {
        errorMessage = 'Failed to sign in. Please try again.';
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-full max-w-md mx-auto">
  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">
        Email
      </label>
      <input
        id="email"
        type="email"
        bind:value={formData.email}
        disabled={loading}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        class:border-red-500={errors.email}
      />
      {#if errors.email}
        <p class="mt-1 text-sm text-red-600">{errors.email}</p>
      {/if}
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">
        Password
      </label>
      <input
        id="password"
        type="password"
        bind:value={formData.password}
        disabled={loading}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        class:border-red-500={errors.password}
      />
      {#if errors.password}
        <p class="mt-1 text-sm text-red-600">{errors.password}</p>
      {/if}
    </div>

    {#if errorMessage}
      <div class="rounded-md bg-red-50 p-4">
        <p class="text-sm text-red-800">{errorMessage}</p>
      </div>
    {/if}

    <button
      type="submit"
      disabled={loading}
      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
    >
      {loading ? 'Signing in...' : 'Sign in'}
    </button>

    <div class="text-sm text-center">
      <a href="/signup" class="font-medium text-primary hover:text-primary/90">
        Don't have an account? Sign up
      </a>
    </div>
  </form>
</div>
```

### 7. Signup Form Component (`src/lib/components/auth/SignupForm.svelte`)
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { authService } from '$lib/services/auth.service';
  import { signupSchema, type SignupFormData } from '$lib/utils/validation';
  import { AppError } from '$lib/utils/errors';

  let formData: SignupFormData = {
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  };

  let errors: Partial<Record<keyof SignupFormData, string>> = {};
  let loading = false;
  let errorMessage = '';

  async function handleSubmit() {
    errors = {};
    errorMessage = '';
    loading = true;

    try {
      const validated = signupSchema.parse(formData);
      await authService.signup(
        validated.email,
        validated.password,
        validated.displayName
      );
      await goto('/dashboard');
    } catch (error) {
      if (error instanceof AppError) {
        errorMessage = error.message;
      } else if (error.errors) {
        error.errors.forEach((err: any) => {
          errors[err.path[0]] = err.message;
        });
      } else {
        errorMessage = 'Failed to create account. Please try again.';
      }
    } finally {
      loading = false;
    }
  }
</script>

<div class="w-full max-w-md mx-auto">
  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div>
      <label for="displayName" class="block text-sm font-medium text-gray-700">
        Full Name
      </label>
      <input
        id="displayName"
        type="text"
        bind:value={formData.displayName}
        disabled={loading}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        class:border-red-500={errors.displayName}
      />
      {#if errors.displayName}
        <p class="mt-1 text-sm text-red-600">{errors.displayName}</p>
      {/if}
    </div>

    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">
        Email
      </label>
      <input
        id="email"
        type="email"
        bind:value={formData.email}
        disabled={loading}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        class:border-red-500={errors.email}
      />
      {#if errors.email}
        <p class="mt-1 text-sm text-red-600">{errors.email}</p>
      {/if}
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">
        Password
      </label>
      <input
        id="password"
        type="password"
        bind:value={formData.password}
        disabled={loading}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        class:border-red-500={errors.password}
      />
      {#if errors.password}
        <p class="mt-1 text-sm text-red-600">{errors.password}</p>
      {/if}
    </div>

    <div>
      <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
        Confirm Password
      </label>
      <input
        id="confirmPassword"
        type="password"
        bind:value={formData.confirmPassword}
        disabled={loading}
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
        class:border-red-500={errors.confirmPassword}
      />
      {#if errors.confirmPassword}
        <p class="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
      {/if}
    </div>

    {#if errorMessage}
      <div class="rounded-md bg-red-50 p-4">
        <p class="text-sm text-red-800">{errorMessage}</p>
      </div>
    {/if}

    <button
      type="submit"
      disabled={loading}
      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
    >
      {loading ? 'Creating account...' : 'Create account'}
    </button>

    <div class="text-sm text-center">
      <a href="/login" class="font-medium text-primary hover:text-primary/90">
        Already have an account? Sign in
      </a>
    </div>
  </form>
</div>
```

### 8. Auth Guard Component (`src/lib/components/auth/AuthGuard.svelte`)
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';

  let initialized = false;

  onMount(() => {
    const unsubscribe = authStore.subscribe((state) => {
      if (state.initialized) {
        initialized = true;
        if (!state.user) {
          goto('/login');
        }
      }
    });

    return unsubscribe;
  });
</script>

{#if initialized}
  <slot />
{:else}
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
{/if}
```

### 9. Login Page (`src/routes/login/+page.svelte`)
```svelte
<script lang="ts">
  import LoginForm from '$lib/components/auth/LoginForm.svelte';
  import { isAuthenticated } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe((authenticated) => {
      if (authenticated) {
        goto('/dashboard');
      }
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  <title>Sign In - NDC Calculator</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Sign in to your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Access the NDC Calculator
      </p>
    </div>
    <LoginForm />
  </div>
</div>
```

### 10. Signup Page (`src/routes/signup/+page.svelte`)
```svelte
<script lang="ts">
  import SignupForm from '$lib/components/auth/SignupForm.svelte';
  import { isAuthenticated } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    const unsubscribe = isAuthenticated.subscribe((authenticated) => {
      if (authenticated) {
        goto('/dashboard');
      }
    });

    return unsubscribe;
  });
</script>

<svelte:head>
  <title>Sign Up - NDC Calculator</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Start using the NDC Calculator
      </p>
    </div>
    <SignupForm />
  </div>
</div>
```

### 11. Protected Routes Layout (`src/routes/(authenticated)/+layout.svelte`)
```svelte
<script lang="ts">
  import AuthGuard from '$lib/components/auth/AuthGuard.svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
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
```

### 12. Header Component (`src/lib/components/layout/Header.svelte`)
```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { authService } from '$lib/services/auth.service';
  import { user } from '$lib/stores/auth';

  async function handleLogout() {
    await authService.logout();
    goto('/login');
  }
</script>

<header class="bg-white shadow">
  <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex">
        <div class="flex-shrink-0 flex items-center">
          <a href="/dashboard" class="text-xl font-bold text-primary">
            NDC Calculator
          </a>
        </div>
        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
          <a
            href="/dashboard"
            class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
          >
            Dashboard
          </a>
          <a
            href="/calculator"
            class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
          >
            Calculator
          </a>
          <a
            href="/history"
            class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
          >
            History
          </a>
        </div>
      </div>
      <div class="flex items-center">
        <div class="ml-3 relative">
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-700">
              {$user?.email || 'User'}
            </span>
            <button
              on:click={handleLogout}
              class="bg-white text-sm text-gray-700 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</header>
```

### 13. Dashboard Page (`src/routes/(authenticated)/dashboard/+page.svelte`)
```svelte
<script lang="ts">
  import { user } from '$lib/stores/auth';
</script>

<svelte:head>
  <title>Dashboard - NDC Calculator</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">
      Welcome back{$user?.displayName ? `, ${$user.displayName}` : ''}!
    </h1>
    <p class="mt-2 text-gray-600">
      Ready to calculate NDC packages?
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <a
      href="/calculator"
      class="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50"
    >
      <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">
        New Calculation
      </h5>
      <p class="font-normal text-gray-700">
        Start a new NDC package calculation
      </p>
    </a>

    <a
      href="/history"
      class="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50"
    >
      <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">
        View History
      </h5>
      <p class="font-normal text-gray-700">
        Browse your past calculations
      </p>
    </a>

    <div class="block p-6 bg-white border border-gray-200 rounded-lg shadow">
      <h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900">
        Quick Stats
      </h5>
      <p class="font-normal text-gray-700">
        Total calculations: 0
      </p>
    </div>
  </div>
</div>
```

## Validation Checklist

- [ ] Users can sign up with email/password
- [ ] Users can sign in with existing credentials
- [ ] Users can sign out
- [ ] Auth state persists on page reload
- [ ] Protected routes redirect to login when not authenticated
- [ ] Authenticated users cannot access login/signup pages
- [ ] Form validation works correctly
- [ ] Error messages display appropriately
- [ ] User data is saved to Firestore
- [ ] Last login time updates correctly

## Success Criteria

✅ Complete authentication flow functional  
✅ Protected routes enforced  
✅ User session management working  
✅ Firestore user documents created  
✅ Error handling comprehensive  
✅ Forms validated properly

---
