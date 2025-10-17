import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should generate magic link on login page', async ({ page }) => {
    await page.goto('/login');

    // Check page loaded
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Fill email and submit
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');

    // Wait for magic link to be generated
    await expect(page.getByText('Magic link generated!')).toBeVisible();

    // Verify magic link is displayed
    const magicLink = page.locator('a[href*="/auth/verify?token="]');
    await expect(magicLink).toBeVisible();
  });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/form');
    
    // Should redirect to login
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });
});

