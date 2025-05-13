import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('should navigate to the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Quantera Platform/);
  });

  test('should navigate to smart account page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Smart Account/i }).click();
    await expect(page.getByRole('heading', { name: 'Smart Account Management' })).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 390, height: 844 });
    
    await page.goto('/');
    
    // Verify mobile menu is present
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
    
    // Open mobile menu
    await page.getByRole('button', { name: /menu/i }).click();
    
    // Check that menu items are visible
    await expect(page.getByRole('link', { name: /Smart Account/i })).toBeVisible();
  });
}); 