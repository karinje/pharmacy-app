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
      } else if (error && typeof error === 'object' && 'issues' in error) {
        // Zod validation errors
        (error as any).issues.forEach((err: any) => {
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

