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
      } else if (error && typeof error === 'object' && 'issues' in error) {
        // Zod validation errors
        (error as any).issues.forEach((err: any) => {
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

