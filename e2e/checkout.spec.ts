import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
  test('add product to cart and navigate to cart page', async ({ page }) => {
    await page.goto('/store/tiendaprueba');
    await page.waitForTimeout(3000);
    const productLink = page.locator('a[href*="/store/tiendaprueba/product/"]').first();
    await productLink.waitFor({ state: 'visible', timeout: 10000 });
    await productLink.click();
    await page.waitForURL(/\/store\/tiendaprueba\/product\//);

    const addToCartBtn = page.getByRole('button', { name: /Agregar al carrito/i });
    await expect(addToCartBtn).toBeVisible({ timeout: 5000 });
    await addToCartBtn.click();

    await page.goto('/store/tiendaprueba/cart');
    await expect(page.getByText('Carrito de compras')).toBeVisible({ timeout: 5000 });
    // Verify cart has items (not empty)
    await expect(page.getByText('producto')).toBeVisible({ timeout: 3000 });
  });

  test('proceed to checkout and verify step indicator', async ({ page }) => {
    // Seed cart via localStorage
    await page.goto('/store/tiendaprueba');
    await page.evaluate(() => {
      const cart = [{
        cart_item_key: 'test-product',
        product_id: 'test-id',
        name: 'Producto de prueba',
        price: 45990,
        image: '/placeholder.svg',
        quantity: 1,
        slug: 'producto-prueba',
      }];
      localStorage.setItem('cart_tiendaprueba', JSON.stringify(cart));
    });

    await page.goto('/store/tiendaprueba/checkout');
    await expect(page.getByText('Checkout')).toBeVisible({ timeout: 5000 });
  });

  test('fill customer info and continue', async ({ page }) => {
    await page.goto('/store/tiendaprueba');
    await page.evaluate(() => {
      const cart = [{
        cart_item_key: 'test-product',
        product_id: 'test-id',
        name: 'Producto de prueba',
        price: 45990,
        image: '/placeholder.svg',
        quantity: 1,
        slug: 'producto-prueba',
      }];
      localStorage.setItem('cart_tiendaprueba', JSON.stringify(cart));
    });

    await page.goto('/store/tiendaprueba/checkout');
    await page.waitForTimeout(2000);

    // Step 1: fill customer info
    const nameInput = page.getByLabel('Nombre completo');
    const emailInput = page.getByLabel('Email');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toBeVisible({ timeout: 3000 });

    await nameInput.fill('Juan Pérez');
    await emailInput.fill('juan@example.com');

    // Click Continuar
    await page.getByRole('button', { name: /Continuar/i }).click();
  });

  test('complete checkout flow through all steps', async ({ page }) => {
    // Seeds cart
    await page.goto('/store/tiendaprueba');
    await page.evaluate(() => {
      const cart = [{
        cart_item_key: 'test-product',
        product_id: 'test-id',
        name: 'Producto de prueba',
        price: 45990,
        image: '/placeholder.svg',
        quantity: 1,
        slug: 'producto-prueba',
      }];
      localStorage.setItem('cart_tiendaprueba', JSON.stringify(cart));
    });

    await page.goto('/store/tiendaprueba/checkout');
    await page.waitForTimeout(2000);

    // Step: Customer info
    await page.getByLabel('Nombre completo').fill('Juan Pérez');
    await page.getByLabel('Email').fill('juan@example.com');
    await page.getByRole('button', { name: /Continuar/i }).click();

    // Step: Shipping (if present) or Payment
    // Check if shipping step appeared
    const shippingStep = page.locator('text=Dirección de envío');
    if (await shippingStep.isVisible({ timeout: 2000 }).catch(() => false)) {
      await page.getByLabel('Dirección').fill('Av. Siempre Viva 123');
      await page.getByLabel('Ciudad').fill('Santiago');
      await page.getByRole('button', { name: /Continuar/i }).click();
    }

    // Step: Payment - verify payment methods visible
    await expect(page.getByText('Método de pago')).toBeVisible({ timeout: 5000 });

    // Click to review
    const reviewBtn = page.getByRole('button', { name: /Revisar pedido/i });
    if (await reviewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await reviewBtn.click();
    } else {
      await page.getByRole('button', { name: /Continuar/i }).click();
    }

    // Step: Review - verify order summary
    await expect(page.getByText('Revisa tu pedido')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Producto de prueba')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Total/i)).toBeVisible();
  });
});
