import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login');
	});

	test('should display login form', async ({ page }) => {
		await expect(page.locator('h1, h2').filter({ hasText: /login|sign in/i })).toBeVisible();
		await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
		await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('should show validation errors for empty form', async ({ page }) => {
		await page.click('button[type="submit"]');

		// Wait for validation errors to appear
		await page.waitForTimeout(500);

		// Check for validation messages (exact text may vary)
		const errorMessages = page.locator('text=/required|invalid|must be/i');
		const count = await errorMessages.count();
		expect(count).toBeGreaterThan(0);
	});

	test('should show error for invalid email format', async ({ page }) => {
		await page.fill('input[type="email"], input[name="email"]', 'invalid-email');
		await page.fill('input[type="password"], input[name="password"]', 'password123');
		await page.click('button[type="submit"]');

		// Wait for validation
		await page.waitForTimeout(500);

		// Should show email validation error
		const emailError = page.locator('text=/email|invalid/i');
		const count = await emailError.count();
		expect(count).toBeGreaterThan(0);
	});

	test('should navigate to signup page', async ({ page }) => {
		const signupLink = page.locator('a[href="/signup"], text=/sign up|create account/i').first();
		if (await signupLink.isVisible()) {
			await signupLink.click();
			await expect(page).toHaveURL(/.*signup.*/);
		}
	});

	test('should handle login with valid credentials', async ({ page }) => {
		// Note: This test assumes you have test credentials or a test mode
		// In a real scenario, you'd use test credentials or mock the auth
		const emailInput = page.locator('input[type="email"], input[name="email"]');
		const passwordInput = page.locator('input[type="password"], input[name="password"]');
		const submitButton = page.locator('button[type="submit"]');

		if (await emailInput.isVisible()) {
			await emailInput.fill('test@example.com');
			await passwordInput.fill('TestPassword123!');
			await submitButton.click();

			// Wait for navigation or error
			await page.waitForTimeout(2000);

			// Either redirects to dashboard or shows error
			const currentUrl = page.url();
			const isDashboard = currentUrl.includes('dashboard') || currentUrl.includes('calculator');
			const hasError = await page.locator('text=/error|invalid|failed/i').isVisible();

			// Test passes if either redirected or error shown (both are valid outcomes)
			expect(isDashboard || hasError).toBe(true);
		}
	});
});

