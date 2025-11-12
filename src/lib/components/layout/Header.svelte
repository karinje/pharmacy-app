<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authService } from '$lib/services/auth.service';
	import { user } from '$lib/stores/auth';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';

	async function handleLogout() {
		await authService.logout();
		goto('/login');
	}

	$: currentPath = $page.url.pathname as string;
</script>

<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<nav class="container mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo and Navigation -->
			<div class="flex items-center gap-8">
				<a href="/dashboard" class="flex items-center space-x-2">
					<div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
						<span class="text-primary-foreground font-bold text-lg">N</span>
					</div>
					<span class="text-xl font-bold">NDC Calculator</span>
				</a>

				<!-- Desktop Navigation -->
				<div class="hidden md:flex items-center space-x-1">
					<a href="/dashboard">
						<Button
							variant={currentPath === '/dashboard' ? 'default' : 'ghost'}
							size="sm"
						>
							Dashboard
						</Button>
					</a>
					<a href="/calculator">
						<Button
							variant={currentPath === '/calculator' ? 'default' : 'ghost'}
							size="sm"
						>
							Calculator
						</Button>
					</a>
					<a href="/history">
						<Button
							variant={currentPath === '/history' ? 'default' : 'ghost'}
							size="sm"
						>
							History
						</Button>
					</a>
				</div>
			</div>

			<!-- User Menu -->
			<div class="flex items-center gap-4">
				<div class="hidden sm:flex items-center gap-2">
					<Badge variant="secondary" class="font-normal">
						{$user?.email || 'User'}
					</Badge>
				</div>
				<Button variant="outline" size="sm" on:click={handleLogout}>
					Sign out
				</Button>
			</div>
		</div>

		<!-- Mobile Navigation -->
		<div class="md:hidden flex items-center space-x-1 pb-3">
			<a href="/dashboard" class="flex-1">
				<Button
					variant={currentPath === '/dashboard' ? 'default' : 'ghost'}
					size="sm"
					class="w-full"
				>
					Dashboard
				</Button>
			</a>
			<a href="/calculator" class="flex-1">
				<Button
					variant={currentPath === '/calculator' ? 'default' : 'ghost'}
					size="sm"
					class="w-full"
				>
					Calculator
				</Button>
			</a>
			<a href="/history" class="flex-1">
				<Button
					variant={currentPath === '/history' ? 'default' : 'ghost'}
					size="sm"
					class="w-full"
				>
					History
				</Button>
			</a>
		</div>
	</nav>
</header>
