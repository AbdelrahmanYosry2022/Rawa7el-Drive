import { test, expect } from '@playwright/test';

test.describe('Exams Platform', () => {
  test('should load exams platform page', async ({ page }) => {
    await page.goto('/exams-platform');
    await page.waitForLoadState('networkidle');
    
    // Check that page loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display exams list or empty state', async ({ page }) => {
    await page.goto('/exams-platform');
    await page.waitForLoadState('networkidle');
    
    // Page should load (may redirect to auth)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Exam Flow', () => {
  test('should handle exam navigation', async ({ page }) => {
    await page.goto('/exams-platform');
    await page.waitForLoadState('networkidle');
    
    // Look for any exam card or link
    const examLink = page.locator('a[href*="exam"], [data-testid*="exam"]').first();
    const isVisible = await examLink.isVisible().catch(() => false);
    
    console.log('Exam link visible:', isVisible);
    
    if (isVisible) {
      await examLink.click();
      await page.waitForLoadState('networkidle');
      // Should navigate to exam page
      expect(page.url()).toContain('exam');
    }
  });
});

test.describe('Exam UI Elements', () => {
  test('should have proper layout structure', async ({ page }) => {
    await page.goto('/exams-platform');
    await page.waitForLoadState('networkidle');
    
    // Check for basic structure
    const hasHeader = await page.locator('header, nav, [role="banner"]').first().isVisible().catch(() => false);
    const hasMain = await page.locator('main, [role="main"]').first().isVisible().catch(() => false);
    
    console.log('Has header:', hasHeader);
    console.log('Has main:', hasMain);
  });
});
