import { test, expect } from '@playwright/test';

test('should display the dashboard title', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('h1')).toContainText('HireTrust - Cartório Digital');
});

test('should have a register agreement form', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('label:has-text("Provider Address")')).toBeVisible();
  await expect(page.locator('button:has-text("Register Agreement")')).toBeVisible();
});
