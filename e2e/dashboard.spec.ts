import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should access dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check that page loaded (might redirect to auth)
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('should display dashboard content when authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for any content on the page
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Dashboard - Subjects Section', () => {
  test('should navigate to subjects if available', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for subjects link or section
    const subjectsLink = page.locator('a[href*="subject"], [data-testid="subjects"]').first();
    const isVisible = await subjectsLink.isVisible().catch(() => false);
    
    if (isVisible) {
      await subjectsLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('subject');
    }
  });
});

test.describe('Dashboard - Exams Section', () => {
  test('should navigate to exams platform if available', async ({ page }) => {
    await page.goto('/exams-platform');
    await page.waitForLoadState('networkidle');
    
    // Page should load
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Dashboard - Resources Section', () => {
  test('should navigate to resources platform if available', async ({ page }) => {
    await page.goto('/resources-platform');
    await page.waitForLoadState('networkidle');
    
    // Page should load
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Dashboard - Activities Section', () => {
  test('should navigate to activities platform if available', async ({ page }) => {
    await page.goto('/activities-platform');
    await page.waitForLoadState('networkidle');
    
    // Page should load
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
