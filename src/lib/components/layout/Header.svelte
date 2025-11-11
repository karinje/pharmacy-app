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

