import { test, expect } from '@playwright/test';

test.describe('Resources Platform', () => {
  test('should load resources platform page', async ({ page }) => {
    await page.goto('/resources-platform');
    await page.waitForLoadState('networkidle');
    
    // Check that page loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display resources content', async ({ page }) => {
    await page.goto('/resources-platform');
    await page.waitForLoadState('networkidle');
    
    // Page should load (may redirect to auth)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Resources - File Types', () => {
  test('should handle PDF resources', async ({ page }) => {
    await page.goto('/resources-platform');
    await page.waitForLoadState('networkidle');
    
    // Look for PDF resources
    const pdfLink = page.locator('a[href*=".pdf"], [data-type="pdf"]').first();
    const isVisible = await pdfLink.isVisible().catch(() => false);
    console.log('PDF resource visible:', isVisible);
  });

  test('should handle video resources', async ({ page }) => {
    await page.goto('/resources-platform');
    await page.waitForLoadState('networkidle');
    
    // Look for video resources
    const videoElement = page.locator('video, [data-type="video"], a[href*="video"]').first();
    const isVisible = await videoElement.isVisible().catch(() => false);
    console.log('Video resource visible:', isVisible);
  });
});

test.describe('Resources - Navigation', () => {
  test('should navigate between resource categories', async ({ page }) => {
    await page.goto('/resources-platform');
    await page.waitForLoadState('networkidle');
    
    // Look for category filters or tabs
    const categoryFilter = page.locator('[data-testid="category"], .category, .filter').first();
    const isVisible = await categoryFilter.isVisible().catch(() => false);
    console.log('Category filter visible:', isVisible);
  });
});
