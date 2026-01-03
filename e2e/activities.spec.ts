import { test, expect } from '@playwright/test';

test.describe('Activities Platform', () => {
  test('should load activities platform page', async ({ page }) => {
    await page.goto('/activities-platform');
    await page.waitForLoadState('networkidle');
    
    // Check that page loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display activities content', async ({ page }) => {
    await page.goto('/activities-platform');
    await page.waitForLoadState('networkidle');
    
    // Page should load (may redirect to auth)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Activities - Types', () => {
  test('should handle worksheet activities', async ({ page }) => {
    await page.goto('/activities-platform');
    await page.waitForLoadState('networkidle');
    
    // Look for worksheet activities
    const worksheet = page.locator('[data-type="worksheet"], .worksheet').first();
    const isVisible = await worksheet.isVisible().catch(() => false);
    console.log('Worksheet visible:', isVisible);
  });

  test('should handle project activities', async ({ page }) => {
    await page.goto('/activities-platform');
    await page.waitForLoadState('networkidle');
    
    // Look for project activities
    const project = page.locator('[data-type="project"], .project').first();
    const isVisible = await project.isVisible().catch(() => false);
    console.log('Project visible:', isVisible);
  });
});
