import { expect, test } from '@playwright/test';

test('index page header has title', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Open-Maneki' })).toBeVisible();
});
