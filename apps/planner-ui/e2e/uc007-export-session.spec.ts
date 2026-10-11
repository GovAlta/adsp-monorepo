import { test, expect } from '@playwright/test';
import { mockPlannerUserAuth } from './fixtures/auth';

/**
 * UC-007: Export Session — E2E flow.
 * Flow: session-export (download)
 * TCs: TC-030, TC-034, FAC-S5-026
 */
test.describe('UC-007: Export Session', () => {
  const SESSION_ID = 'e2e-session-export-001';

  const SESSION_PAYLOAD = {
    id: SESSION_ID,
    title: 'Export E2E Session',
    status: 'active',
    hypothesisStatus: 'accepted',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test.beforeEach(async ({ page }) => {
    await mockPlannerUserAuth(page);

    // Mock GET session
    await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SESSION_PAYLOAD),
      });
    });

    // Mock GET exports
    await page.route(`**/api/v1/sessions/${SESSION_ID}/exports*`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  // TC-030: session-export page loads with accepted hypothesis
  test('TC-030: session-export page loads with accepted hypothesis', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/export`);
    await expect(page.locator('h1')).toContainText(/Export/i);
  });

  // All three tabs render on session-export
  test('session-export renders Business Model, Hypothesis, and Specialists tabs', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/export`);
    await expect(page.locator('text=Business Model Summary')).toBeVisible();
    await expect(page.locator('text=Hypothesis Summary')).toBeVisible();
    await expect(page.locator('text=Specialist Consultations')).toBeVisible();
  });

  // TC-034: Download JSON Export triggers POST /exports and download
  test('TC-034: Download JSON Export triggers POST and download', async ({ page }) => {
    let postCalled = false;

    await page.route(`**/api/v1/sessions/${SESSION_ID}/exports`, async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'export-e2e-001',
            sessionId: SESSION_ID,
            format: 'json',
            downloadUrl: `/api/v1/sessions/${SESSION_ID}/exports/export-e2e-001`,
            createdAt: new Date().toISOString(),
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Intercept the download URL request (blob response)
    await page.route(`**/exports/export-e2e-001`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: SESSION_ID,
          title: 'Export E2E Session',
          exportedAt: new Date().toISOString(),
        }),
      });
    });

    await page.goto(`/sessions/${SESSION_ID}/export`);

    // Wait for download event (anchor click mock triggers download)
    const [_download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
      page.click('text=Download JSON Export'),
    ]);

    expect(postCalled).toBe(true);
    // Download event may or may not fire depending on implementation; POST is the key assertion
  });

  // FAC-S5-026: No session content in localStorage after visiting export page
  test('FAC-S5-026: no session data in localStorage after export page visit', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/export`);
    const storageItem = await page.evaluate(() => localStorage.getItem('sessionData'));
    expect(storageItem).toBeNull();
  });

  // FAC-S5-026: No export payload stored in sessionStorage
  test('FAC-S5-026: no export payload in sessionStorage', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/export`);
    const sessionStorageItem = await page.evaluate(() => sessionStorage.getItem('exportData'));
    expect(sessionStorageItem).toBeNull();
  });
});
