import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('page loads and shows title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AutoShopping/);
  });

  test('hero section is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Crea tu tienda online|Lanza tu tienda online|Comenzar gratis/)).toBeVisible();
  });

  test('pricing section has 3 plan cards', async ({ page }) => {
    await page.goto('/');
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    await expect(page.locator('#pricing')).toBeVisible();
    const cards = page.locator('#pricing .grid > div');
    await expect(cards).toHaveCount(3);
  });

  test('Comenzar gratis CTA exists', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByText('Comenzar gratis').first();
    await expect(cta).toBeVisible();
  });
});
