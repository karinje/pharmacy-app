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

