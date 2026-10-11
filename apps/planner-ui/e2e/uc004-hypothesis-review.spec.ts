import { test, expect } from '@playwright/test';
import { mockPlannerUserAuth } from './fixtures/auth';

/**
 * UC-004: Hypothesis Review → Session Export — multi-page E2E flow.
 * Flow: hypothesis-review → session-export (on accept)
 * TCs: TC-022, TC-023, TC-034
 */
test.describe('UC-004: Hypothesis Review', () => {
  const SESSION_ID = 'e2e-session-uc004';

  const HYPOTHESIS_PAYLOAD = {
    id: 'hyp-uc004-001',
    sessionId: SESSION_ID,
    summary: 'Adopt ADSP notification service to streamline applicant communications.',
    reasoning: 'The business model identifies notification gaps across 3 processes.',
    status: 'pending',
    confidenceScore: 80,
    createdAt: new Date().toISOString(),
  };

  test.beforeEach(async ({ page }) => {
    await mockPlannerUserAuth(page);

    // Mock session
    await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: SESSION_ID,
          title: 'UC-004 Hypothesis E2E',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    // Mock GET hypotheses — high confidence, unlocked
    await page.route(`**/api/v1/sessions/${SESSION_ID}/hypotheses**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [HYPOTHESIS_PAYLOAD],
            pagination: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  // TC-022: Hypothesis loads in unlocked state (confidence >= 70)
  test('TC-022: hypothesis-review renders unlocked — summary and reasoning visible', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/hypothesis`);
    await expect(page.locator('h1')).toContainText(/Hypothesis/i);
    await expect(page.locator('[data-testid="hypothesis-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="hypothesis-reasoning"]')).toBeVisible();
  });

  // TC-023: INT-001 pending banner visible, revision disabled
  test('TC-023: INT-001 pending banner visible; Request Revision disabled', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/hypothesis`);
    await expect(
      page.locator('[data-testid="int001-stub-notice"], [role="note"]').first(),
    ).toBeVisible();
    // Revision button should be disabled under INT-001 stub
    const revisionBtn = page.locator(
      '[data-testid="request-revision-btn"], button:has-text("Request Revision")',
    );
    if (await revisionBtn.count() > 0) {
      await expect(revisionBtn).toBeDisabled();
    }
  });

  // TC-034: Accept Hypothesis → PATCH → navigate to session-export
  test('TC-034: Accept Hypothesis triggers PATCH and navigates to session-export', async ({ page }) => {
    let patchCalled = false;

    // Mock PATCH /api/v1/sessions/:id/hypotheses/:hypothesisId
    await page.route(
      `**/api/v1/sessions/${SESSION_ID}/hypotheses/${HYPOTHESIS_PAYLOAD.id}`,
      async (route) => {
        if (route.request().method() === 'PATCH') {
          patchCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ...HYPOTHESIS_PAYLOAD,
              status: 'accepted',
            }),
          });
        } else {
          await route.continue();
        }
      },
    );

    // Mock GET exports for session-export page
    await page.route(`**/api/v1/sessions/${SESSION_ID}/exports**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
        }),
      });
    });

    await page.goto(`/sessions/${SESSION_ID}/hypothesis`);
    await page.click('text=Accept Hypothesis');

    expect(patchCalled).toBe(true);
    await expect(page).toHaveURL(new RegExp(`/sessions/${SESSION_ID}/export`));
  });

  // session-export page loads with accepted hypothesis → export enabled
  test('session-export loads with accepted hypothesis and export button enabled', async ({ page }) => {
    // Mock session as having accepted hypothesis
    await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: SESSION_ID,
          title: 'UC-004 Hypothesis E2E',
          status: 'active',
          hypothesisStatus: 'accepted',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    await page.route(`**/api/v1/sessions/${SESSION_ID}/exports**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
        }),
      });
    });

    await page.goto(`/sessions/${SESSION_ID}/export`);
    await expect(page.locator('h1')).toContainText(/Export/i);
    const exportBtn = page.locator(
      '[data-testid="download-export-btn"], button:has-text("Download")',
    );
    await expect(exportBtn).toBeEnabled();
  });

  // FAC-S5-026: No sessionData in localStorage after visiting hypothesis-review
  test('FAC-S5-026: no Protected B data in localStorage after hypothesis-review', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/hypothesis`);
    const storageItem = await page.evaluate(() => localStorage.getItem('sessionData'));
    expect(storageItem).toBeNull();
  });
});
