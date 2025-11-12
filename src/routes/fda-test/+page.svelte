<script lang="ts">
	import { fdaService } from '$lib/services/fda.service';
	import { functions } from '$lib/config/firebase';
	import { httpsCallable } from 'firebase/functions';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardContent } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Alert, AlertTitle, AlertDescription } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Spinner } from '$lib/components/ui/spinner';
	import { isAuthenticated } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import type { NDCProduct } from '$lib/types/fda';
	import type { PageProps } from './$types';
	
	// Suppress SvelteKit params warning
	export let data: PageProps['data'];
	export let params: PageProps['params'];

	let loading = false;
	let error: string | null = null;
	let results: NDCProduct[] = [];
	let validationResult: any = null;
	let isAuth = false;
	
	// Check auth state
	isAuthenticated.subscribe((auth) => {
		isAuth = auth;
	});

	// Test NDC codes (valid active NDCs from FDA API)
	const testNDCs = [
		'72288-050-60', // Ibuprofen PM 20 tablets (VALID - Amazon)
		'72288-050-76', // Ibuprofen PM 120 tablets (VALID - Amazon)
		'72162-2285-2', // Children's Ibuprofen (VALID - Bryant Ranch)
		'68180-517-01' // Another format to test
	];

	// Test drug names
	const testDrugs = ['ibuprofen', 'acetaminophen', 'aspirin', 'atorvastatin'];

	let searchTerm = 'ibuprofen';
	let ndcInput = '72288-050-60'; // Pre-populate with valid NDC (Ibuprofen PM - Amazon)

	const validateNDCFn = httpsCallable<{ ndc: string }, any>(functions, 'validateNDC');

	async function testSearchByDrugName() {
		loading = true;
		error = null;
		results = [];

		try {
			const products = await fdaService.searchNDCsByDrugName(searchTerm);
			results = products;
			console.log('Search results:', products);
		} catch (err: any) {
			error = err.message || 'Failed to search NDCs';
			console.error('Search error:', err);
		} finally {
			loading = false;
		}
	}

	async function testValidateNDC() {
		loading = true;
		error = null;
		validationResult = null;

		try {
			// Test client-side validation
			const product = await fdaService.validateNDC(ndcInput);
			validationResult = { source: 'client', product };

			// Also test Cloud Function (requires authentication)
			if (isAuth) {
				try {
					const cloudResult = await validateNDCFn({ ndc: ndcInput });
					validationResult.cloudFunction = cloudResult.data;
				} catch (cfError: any) {
					// Handle auth errors
					if (cfError.code === 'functions/unauthenticated' || cfError.code === 'functions/permission-denied') {
						validationResult.cloudFunctionNote = 'Authentication required. Please log in to test Cloud Function.';
					} else if (cfError.code === 'functions/unavailable' || cfError.message?.includes('CORS')) {
						validationResult.cloudFunctionNote = 'Cloud Function not available (may need deployment)';
					} else {
						validationResult.cloudFunctionError = cfError.message || cfError.code;
					}
				}
			} else {
				validationResult.cloudFunctionNote = 'Please log in to test Cloud Function (authentication required)';
			}
		} catch (err: any) {
			// 404s are expected for invalid NDCs, don't show as error
			if (err instanceof Error && err.message?.includes('404')) {
				validationResult = { source: 'client', product: null, note: 'NDC not found (expected for invalid codes)' };
			} else {
				error = err.message || 'Failed to validate NDC';
				console.error('Validation error:', err);
			}
		} finally {
			loading = false;
		}
	}

	async function testNDCNormalization() {
		// Test normalization directly (without requiring FDA API validation)
		const testCases = [
			{ input: '72288-050-60', expected: '72288005060', description: '5-3-2 format' },
			{ input: '68180-517-01', expected: '68180051701', description: '5-3-2 format' },
			{ input: '68180-517-1', expected: '68180051701', description: '5-3-2 format (1-digit package)' },
			{ input: '16714-0137-01', expected: '16714013701', description: '5-4-2 format' },
			{ input: '00069-1010-01', expected: '00069101001', description: '5-4-2 format (leading zeros)' },
			{ input: '6818051701', expected: '06818051701', description: 'No hyphens (10 digits)' }
		];

		console.log('=== NDC Normalization Test ===');
		console.log('Testing how different NDC formats are normalized to 11-digit format\n');
		console.log('Format: labeler(5) + product(4) + package(2) = 11 digits\n');
		
		let passed = 0;
		let failed = 0;
		
		for (const testCase of testCases) {
			// Test normalization directly (no API call needed)
			const normalized = fdaService.normalizeNDC(testCase.input);
			const match = normalized === testCase.expected;
			
			// Also check if it exists in FDA (optional, for info only)
			let inFDA = false;
			try {
				const product = await fdaService.validateNDC(testCase.input);
				inFDA = !!product;
			} catch {
				// Ignore errors, just checking if exists
			}
			
			if (match) {
				passed++;
				const fdaStatus = inFDA ? '(found in FDA)' : '(not in FDA)';
				console.log(`✓ ${testCase.input.padEnd(18)} -> ${normalized.padEnd(15)} ${testCase.description} ${fdaStatus}`);
			} else {
				failed++;
				console.log(`✗ ${testCase.input.padEnd(18)} -> ${normalized.padEnd(15)} ${testCase.description}`);
				console.log(`  Expected: ${testCase.expected}`);
				console.log(`  Got:      ${normalized}`);
			}
		}
		
		console.log(`\n=== Test Complete ===`);
		console.log(`Passed: ${passed}/${testCases.length}, Failed: ${failed}/${testCases.length}`);
		
		if (failed === 0) {
			alert(`✓ All normalization tests passed! (${passed}/${testCases.length})`);
		} else {
			alert(`✗ Some tests failed. Check console for details. (${passed}/${testCases.length} passed)`);
		}
	}

	function testFiltering() {
		if (results.length === 0) {
			alert('Search for products first');
			return;
		}

		const active = fdaService.filterActiveNDCs(results);
		const inactive = fdaService.filterInactiveNDCs(results);

		console.log('Active NDCs:', active.length);
		console.log('Inactive NDCs:', inactive.length);
		alert(`Active: ${active.length}, Inactive: ${inactive.length}`);
	}
</script>

<svelte:head>
	<title>FDA API Test - NDC Calculator</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
	<div>
		<h1 class="text-3xl font-bold mb-2">FDA NDC API Integration Test</h1>
		<p class="text-muted-foreground">Test the FDA service implementation</p>
		{#if !isAuth}
			<Alert class="mt-4">
				<AlertTitle>Authentication Notice</AlertTitle>
				<AlertDescription>
					Cloud Function testing requires authentication. Client-side FDA API calls work without authentication.
					<Button variant="link" class="ml-2 p-0 h-auto" on:click={() => goto('/login')}>
						Log in
					</Button>
				</AlertDescription>
			</Alert>
		{/if}
	</div>

	{#if error}
		<Alert variant="destructive">
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	<!-- Search by Drug Name -->
	<Card>
		<CardHeader>
			<h2 class="text-2xl font-semibold">1. Search NDCs by Drug Name</h2>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex gap-4">
				<div class="flex-1">
					<Label for="search-term">Generic Drug Name</Label>
					<Input
						id="search-term"
						bind:value={searchTerm}
						placeholder="e.g., ibuprofen"
						disabled={loading}
					/>
				</div>
				<div class="flex items-end">
					<Button on:click={testSearchByDrugName} disabled={loading}>
						{#if loading}
							<Spinner size="sm" className="mr-2" />
						{/if}
						Search
					</Button>
				</div>
			</div>

			<div class="flex gap-2 flex-wrap">
				{#each testDrugs as drug}
					<Button
						variant="outline"
						size="sm"
						on:click={() => {
							searchTerm = drug;
							testSearchByDrugName();
						}}
						disabled={loading}
					>
						{drug}
					</Button>
				{/each}
			</div>

			{#if results.length > 0}
				<div class="mt-4">
					<p class="text-sm text-muted-foreground mb-2">
						Found {results.length} products
					</p>
					<div class="space-y-2 max-h-96 overflow-y-auto">
						{#each results.slice(0, 10) as product}
							<div class="border rounded p-3 text-sm">
								<div class="flex items-center gap-2 mb-1">
									<Badge variant={product.isActive ? 'default' : 'secondary'}>
										{product.isActive ? 'Active' : 'Inactive'}
									</Badge>
									<span class="font-mono text-xs">{product.ndc}</span>
								</div>
								<div class="font-semibold">{product.genericName}</div>
								{#if product.brandName}
									<div class="text-muted-foreground">Brand: {product.brandName}</div>
								{/if}
								<div class="text-muted-foreground">
									{product.packageSize} {product.packageUnit} - {product.manufacturer}
								</div>
								<div class="text-xs text-muted-foreground mt-1">
									{product.packageDescription}
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-4 flex gap-2">
						<Button variant="outline" size="sm" on:click={testFiltering}>
							Test Filtering
						</Button>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Validate NDC -->
	<Card>
		<CardHeader>
			<h2 class="text-2xl font-semibold">2. Validate NDC Code</h2>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex gap-4">
				<div class="flex-1">
					<Label for="ndc-input">NDC Code</Label>
					<Input
						id="ndc-input"
						bind:value={ndcInput}
						placeholder="e.g., 68180-517-01"
						disabled={loading}
					/>
				</div>
				<div class="flex items-end">
					<Button on:click={testValidateNDC} disabled={loading}>
						{#if loading}
							<Spinner size="sm" className="mr-2" />
						{/if}
						Validate
					</Button>
				</div>
			</div>

			<div class="flex gap-2 flex-wrap">
				{#each testNDCs as ndc}
					<Button
						variant="outline"
						size="sm"
						on:click={() => {
							ndcInput = ndc;
							testValidateNDC();
						}}
						disabled={loading}
					>
						{ndc}
					</Button>
				{/each}
			</div>

			{#if validationResult}
				<div class="mt-4 space-y-4">
					{#if validationResult.product}
						<Alert>
							<AlertTitle>Client-Side Validation</AlertTitle>
							<AlertDescription>
								<div class="space-y-2 mt-2">
									<div>
										<strong>NDC:</strong> {validationResult.product.ndc} ({validationResult.product.ndc11})
									</div>
									<div>
										<strong>Generic Name:</strong> {validationResult.product.genericName}
									</div>
									{#if validationResult.product.brandName}
										<div><strong>Brand:</strong> {validationResult.product.brandName}</div>
									{/if}
									<div>
										<strong>Status:</strong>
										<Badge
											variant={validationResult.product.isActive ? 'default' : 'secondary'}
											class="ml-2"
										>
											{validationResult.product.isActive ? 'Active' : 'Inactive'}
										</Badge>
									</div>
									<div>
										<strong>Package:</strong> {validationResult.product.packageSize}{' '}
										{validationResult.product.packageUnit}
									</div>
								</div>
							</AlertDescription>
						</Alert>
					{:else}
						<Alert variant="destructive">
							<AlertTitle>NDC Not Found</AlertTitle>
							<AlertDescription>The NDC code was not found in the FDA database.</AlertDescription>
						</Alert>
					{/if}

					{#if validationResult.cloudFunction}
						<Alert>
							<AlertTitle>Cloud Function Validation</AlertTitle>
							<AlertDescription>
								<pre class="text-xs mt-2 overflow-auto">
									{JSON.stringify(validationResult.cloudFunction, null, 2)}
								</pre>
							</AlertDescription>
						</Alert>
					{/if}

					{#if validationResult.cloudFunctionNote}
						<Alert>
							<AlertTitle>Cloud Function</AlertTitle>
							<AlertDescription>{validationResult.cloudFunctionNote}</AlertDescription>
						</Alert>
					{/if}

					{#if validationResult.cloudFunctionError}
						<Alert variant="destructive">
							<AlertTitle>Cloud Function Error</AlertTitle>
							<AlertDescription>{validationResult.cloudFunctionError}</AlertDescription>
						</Alert>
					{/if}

					{#if validationResult.note}
						<Alert>
							<AlertTitle>Note</AlertTitle>
							<AlertDescription>{validationResult.note}</AlertDescription>
						</Alert>
					{/if}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Test Utilities -->
	<Card>
		<CardHeader>
			<h2 class="text-2xl font-semibold">3. Test Utilities</h2>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex gap-2">
				<Button variant="outline" on:click={testNDCNormalization} disabled={loading}>
					Test NDC Normalization
				</Button>
				<Button
					variant="outline"
					on:click={() => {
						fdaService.clearCache();
						alert('Cache cleared');
					}}
				>
					Clear Cache
				</Button>
			</div>
			<p class="text-sm text-muted-foreground">
				Check browser console for normalization test results
			</p>
		</CardContent>
	</Card>
</div>

