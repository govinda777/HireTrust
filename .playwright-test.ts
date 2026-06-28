import { test, expect } from '@playwright/test';

test('verify provider dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/provider');
  await expect(page.locator('h1')).toContainText('Dashboard do Prestador');
  await expect(page.locator('button')).toContainText('Enviar Prova de Serviço');
});
