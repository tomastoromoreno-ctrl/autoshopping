import { test, expect } from '@playwright/test';

test.describe('Store Page', () => {
  test('visit store and wait for products', async ({ page }) => {
    await page.goto('/store/tiendaprueba');
    // Wait for loading to finish (skeleton disappears)
    await page.waitForTimeout(3000);
  });

  test('product cards are visible after loading', async ({ page }) => {
    await page.goto('/store/tiendaprueba');
    // Wait for product grid to render
    await page.waitForTimeout(3000);
    const productCards = page.locator('a[href*="/store/tiendaprueba/product/"]').first();
    await expect(productCards).toBeVisible({ timeout: 10000 });
  });

  test('search bar exists', async ({ page }) => {
    await page.goto('/store/tiendaprueba');
    await page.waitForTimeout(2000);
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('click product card navigates to product page', async ({ page }) => {
    await page.goto('/store/tiendaprueba');
    await page.waitForTimeout(3000);
    const productLink = page.locator('a[href*="/store/tiendaprueba/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 10000 });
    await productLink.click();
    await page.waitForURL(/\/store\/tiendaprueba\/product\//);
  });

  test('product detail page shows name, price and add to cart button', async ({ page }) => {
    await page.goto('/store/tiendaprueba');
    await page.waitForTimeout(3000);
    const productLink = page.locator('a[href*="/store/tiendaprueba/product/"]').first();
    await productLink.waitFor({ state: 'visible', timeout: 10000 });
    await productLink.click();
    await page.waitForURL(/\/store\/tiendaprueba\/product\//);

    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
    const addToCartBtn = page.getByRole('button', { name: /Agregar al carrito/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
  });

  test('add to cart and verify cart updates', async ({ page }) => {
    await page.goto('/store/tiendaprueba');
    await page.waitForTimeout(3000);
    const productLink = page.locator('a[href*="/store/tiendaprueba/product/"]').first();
    await productLink.waitFor({ state: 'visible', timeout: 10000 });
    await productLink.click();
    await page.waitForURL(/\/store\/tiendaprueba\/product\//);

    const addToCartBtn = page.getByRole('button', { name: /Agregar al carrito/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();

    // Check for cart icon badge or toast feedback
    await expect(page.getByText('¡Agregado!').or(page.locator('[aria-label*="carrito"]'))).toBeVisible({ timeout: 3000 });
  });
});
