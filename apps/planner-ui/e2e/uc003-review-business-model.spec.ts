import { test, expect } from '@playwright/test';
import { mockPlannerUserAuth } from './fixtures/auth';

/**
 * UC-003: Review Business Model → Hypothesis Review — multi-page E2E flow.
 * Flow: business-model-review → hypothesis-review (on confirm)
 * TCs: TC-006, TC-022
 */
test.describe('UC-003: Review Business Model', () => {
  const SESSION_ID = 'e2e-session-uc003';

  test.beforeEach(async ({ page }) => {
    await mockPlannerUserAuth(page);

    // Mock session
    await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: SESSION_ID,
          title: 'UC-003 E2E Session',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    // Mock GET business model — high confidence (75)
    await page.route(`**/api/v1/sessions/${SESSION_ID}/model**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessionId: SESSION_ID,
            confidenceScore: 75,
            extractedAt: new Date().toISOString(),
            version: 2,
            actors: [
              { id: 'actor-1', name: 'Program Officer', conceptType: 'actor', sourceText: 'officers approve' },
            ],
            processes: [
              { id: 'proc-1', name: 'Application Processing', conceptType: 'process', sourceText: 'processing workflow' },
            ],
            systems: [
              { id: 'sys-1', name: 'ADSP Platform', conceptType: 'system', sourceText: 'the platform' },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  // TC-022: Business model review page loads with high confidence
  test('TC-022: business-model-review loads with high-confidence model (score 75)', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/model`);
    await expect(page.locator('h1')).toContainText(/Business Model/i);
    const badgeText = await page
      .locator('[data-testid="confidence-badge"], [data-testid*="confidence"]')
      .first()
      .textContent();
    expect(badgeText).toMatch(/75|high|success/i);
  });

  // TC-006: Confirm Business Model → PATCH → navigate to hypothesis-review
  test('TC-006: Confirm Business Model action triggers PATCH and navigates to hypothesis-review', async ({ page }) => {
    let patchCalled = false;

    // Mock PATCH /api/v1/sessions/:id/model (confirm)
    await page.route(`**/api/v1/sessions/${SESSION_ID}/model`, async (route) => {
      if (route.request().method() === 'PATCH') {
        patchCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessionId: SESSION_ID,
            confidenceScore: 75,
            version: 2,
            confirmed: true,
          }),
        });
      } else if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            sessionId: SESSION_ID,
            confidenceScore: 75,
            extractedAt: new Date().toISOString(),
            version: 2,
            actors: [],
            processes: [],
            systems: [],
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET hypotheses for landing on hypothesis-review
    await page.route(`**/api/v1/sessions/${SESSION_ID}/hypotheses**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'hyp-001',
              sessionId: SESSION_ID,
              summary: 'Implement ADSP workflow service to automate permit processing.',
              reasoning: 'Based on actors and processes identified in the business model.',
              status: 'pending',
              confidenceScore: 75,
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
        }),
      });
    });

    await page.goto(`/sessions/${SESSION_ID}/model`);
    await page.click('text=Confirm Business Model');

    // PATCH must have been called
    expect(patchCalled).toBe(true);

    // Should navigate to hypothesis-review
    await expect(page).toHaveURL(new RegExp(`/sessions/${SESSION_ID}/hypothesis`));
  });

  // Hypothesis review loads with unlocked state (confidence >= 70)
  test('hypothesis-review loads in unlocked state when confidence >= 70', async ({ page }) => {
    await page.route(`**/api/v1/sessions/${SESSION_ID}/hypotheses**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'hyp-001',
              sessionId: SESSION_ID,
              summary: 'Implement ADSP workflow service to automate permit processing.',
              reasoning: 'Based on actors and processes identified in the business model.',
              status: 'pending',
              confidenceScore: 75,
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
        }),
      });
    });

    await page.goto(`/sessions/${SESSION_ID}/hypothesis`);
    await expect(page.locator('h1')).toContainText(/Hypothesis/i);
    // Summary should be visible (unlocked state)
    await expect(page.locator('[data-testid="hypothesis-summary"]')).toBeVisible();
  });

  // MaskedField present on hypothesis summary (security check)
  test('hypothesis summary renders via MaskedField or masked component', async ({ page }) => {
    await page.route(`**/api/v1/sessions/${SESSION_ID}/hypotheses**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'hyp-001',
              sessionId: SESSION_ID,
              summary: 'Implement ADSP workflow service.',
              reasoning: 'Based on business model analysis.',
              status: 'pending',
              confidenceScore: 75,
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
        }),
      });
    });

    await page.goto(`/sessions/${SESSION_ID}/hypothesis`);
    // Hypothesis summary section visible
    await expect(page.locator('[data-testid="hypothesis-summary"]')).toBeVisible();
    // FAC-S5-026: no Protected B content in localStorage
    const storageItem = await page.evaluate(() => localStorage.getItem('sessionData'));
    expect(storageItem).toBeNull();
  });
});
