import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login form is visible with email and password fields', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
  });

  test('iniciar sesion button exists', async ({ page }) => {
    await page.goto('/auth/login');
    const loginBtn = page.getByRole('button', { name: /Iniciar sesión/i });
    await expect(loginBtn).toBeVisible();
  });

  test('form validation - submit empty form shows error or keeps validation', async ({ page }) => {
    await page.goto('/auth/login');
    const loginBtn = page.getByRole('button', { name: /Iniciar sesión/i });
    await loginBtn.click();
    // HTML5 validation should prevent submission or show an error
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('link to register page exists', async ({ page }) => {
    await page.goto('/auth/login');
    const registerLink = page.getByRole('link', { name: /Regístrate/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute('href', '/auth/register');
  });
});
