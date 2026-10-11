import { test, expect } from '@playwright/test';
import { mockTenantAdminAuth } from './fixtures/auth';

/**
 * UC-010: Pattern Management — multi-page E2E flow.
 * Flow: admin-hub → pattern-library → pattern-editor (create)
 * TCs: TC-027, TC-029, TC-082
 */
test.describe('UC-010: Pattern Management', () => {
  const PATTERNS = [
    {
      id: 'pattern-001',
      name: 'Notification Pattern',
      description: 'Matches notification and alerting needs.',
      status: 'active',
      matchThreshold: 70,
      keywords: ['notify', 'alert', 'email'],
      matchCount: 12,
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'pattern-002',
      name: 'Workflow Automation',
      description: 'Matches workflow and approval processes.',
      status: 'active',
      matchThreshold: 65,
      keywords: ['workflow', 'approval', 'process'],
      matchCount: 8,
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'pattern-003',
      name: 'Data Integration',
      description: 'Matches data migration and integration needs.',
      status: 'active',
      matchThreshold: 80,
      keywords: ['data', 'integration', 'migration'],
      matchCount: 3,
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Tenant-admin auth for full pattern management
    await mockTenantAdminAuth(page);

    // Mock GET /api/v1/patterns
    await page.route('**/api/v1/patterns*', async (route) => {
      if (route.request().method() === 'GET' && !route.request().url().includes('/patterns/')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: PATTERNS,
            pagination: { page: 1, pageSize: 10, totalCount: 3, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET /api/v1/sessions and /api/v1/audit for admin hub stats
    await page.route('**/api/v1/sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { page: 1, pageSize: 1, totalCount: 7, totalPages: 7 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/api/v1/audit*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, pageSize: 1, totalCount: 15, totalPages: 15 },
        }),
      });
    });
  });

  // UC-010 step 1: Navigate to admin hub
  test('navigates to admin-hub at /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText(/Administration/i);
  });

  // UC-010 step 2: Click "Manage Patterns" → /admin/patterns
  test('Manage Patterns tile navigates to pattern-library', async ({ page }) => {
    await page.goto('/admin');
    await page.click('text=Manage Patterns, text=Pattern Library');
    await expect(page).toHaveURL(/\/admin\/patterns/);
  });

  // TC-027: Pattern library loads with 3 patterns
  test('TC-027: pattern-library loads with pattern list', async ({ page }) => {
    await page.goto('/admin/patterns');
    await expect(page.locator('h1')).toContainText(/Pattern Library/i);
    await expect(page.locator('text=Notification Pattern')).toBeVisible();
    await expect(page.locator('text=Workflow Automation')).toBeVisible();
    await expect(page.locator('text=Data Integration')).toBeVisible();
  });

  // UC-010 step 4: Click "Create Pattern" → navigate to /admin/patterns/new
  test('Create Pattern navigates to pattern-editor in create mode', async ({ page }) => {
    await page.goto('/admin/patterns');
    await page.click('text=Create Pattern');
    await expect(page).toHaveURL(/\/admin\/patterns\/new/);
  });

  // TC-029 + UC-010 steps 5–7: Fill pattern form and save
  test('TC-029: filling pattern form and saving triggers POST and navigates back to library', async ({
    page,
  }) => {
    let postCalled = false;

    // Mock POST /api/v1/patterns
    await page.route('**/api/v1/patterns', async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        const body = route.request().postDataJSON() as {
          name?: string;
          description?: string;
          status?: string;
          matchThreshold?: number;
        };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'pattern-new-001',
            name: body?.name ?? 'New E2E Pattern',
            description: body?.description ?? 'E2E test pattern',
            status: body?.status ?? 'active',
            matchThreshold: body?.matchThreshold ?? 75,
            keywords: [],
            matchCount: 0,
            updatedAt: new Date().toISOString(),
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: PATTERNS,
            pagination: { page: 1, pageSize: 10, totalCount: 3, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin/patterns/new');

    // Fill form fields
    await page.fill('[data-testid="pattern-name-input"], input[name="name"]', 'E2E Test Pattern');
    await page.fill(
      '[data-testid="pattern-description-input"], textarea[name="description"]',
      'An E2E test pattern for Playwright validation.',
    );

    // Status = active (may be a dropdown or radio)
    const statusDropdown = page.locator(
      '[data-testid="pattern-status-select"], select[name="status"]',
    );
    if (await statusDropdown.count() > 0) {
      await statusDropdown.selectOption('active');
    }

    // matchThreshold = 75
    const thresholdInput = page.locator(
      '[data-testid="match-threshold-input"], input[name="matchThreshold"]',
    );
    if (await thresholdInput.count() > 0) {
      await thresholdInput.fill('75');
    }

    // Submit
    await page.click('text=Save Pattern');

    expect(postCalled).toBe(true);
    // Navigate back to pattern library
    await expect(page).toHaveURL(/\/admin\/patterns/);
  });

  // TC-082: Keyboard accessible — form fields reachable via Tab
  test('TC-082: pattern editor form fields are keyboard accessible', async ({ page }) => {
    await page.goto('/admin/patterns/new');
    // Tab through form fields to verify focus management
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']).toContain(focusedTag);
  });
});
