import { test, expect } from '@playwright/test';
import { mockPlannerUserAuth } from './fixtures/auth';

/**
 * UC-002/003: Business Discovery → Business Model Review — multi-page E2E flow.
 * Flow: planning-session → business-model-review
 * TCs: TC-003, TC-021, TC-022
 */
test.describe('UC-002/003: Business Discovery and Model Review', () => {
  const SESSION_ID = 'e2e-session-bm-01';

  test.beforeEach(async ({ page }) => {
    await mockPlannerUserAuth(page);

    // Mock GET /api/v1/sessions/:id
    await page.route(`**/api/v1/sessions/${SESSION_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: SESSION_ID,
          title: 'Business Discovery E2E',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    // Mock GET /api/v1/sessions/:id/messages
    await page.route(`**/api/v1/sessions/${SESSION_ID}/messages**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'msg-001',
              sessionId: SESSION_ID,
              role: 'user',
              content: 'We need to streamline permit applications.',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'msg-002',
              sessionId: SESSION_ID,
              role: 'assistant',
              content: 'I can help analyze your business process.',
              createdAt: new Date().toISOString(),
            },
          ],
          pagination: { page: 1, pageSize: 50, totalCount: 2, totalPages: 1 },
        }),
      });
    });

    // Mock GET /api/v1/sessions/:id/model (medium confidence: 65)
    await page.route(`**/api/v1/sessions/${SESSION_ID}/model**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: SESSION_ID,
          confidenceScore: 65,
          extractedAt: new Date().toISOString(),
          version: 1,
          actors: [
            { id: 'actor-1', name: 'Permit Applicant', conceptType: 'actor', sourceText: 'applicants submit' },
          ],
          processes: [
            { id: 'proc-1', name: 'Permit Review', conceptType: 'process', sourceText: 'review workflow' },
          ],
          systems: [
            { id: 'sys-1', name: 'Permit Portal', conceptType: 'system', sourceText: 'the portal' },
          ],
        }),
      });
    });
  });

  // TC-003: Planning session loads with stub INT-001 notice
  test('TC-003: planning-session loads with INT-001 stub notice visible', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/planning`);
    await expect(
      page.locator('[data-testid="int001-stub-notice"], [role="note"]').first(),
    ).toBeVisible();
  });

  // UC-002: Navigate from planning session to business model review
  test('Review Business Model link navigates to business-model-review', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/planning`);
    await page.click('text=Review Business Model');
    await expect(page).toHaveURL(new RegExp(`/sessions/${SESSION_ID}/model`));
  });

  // TC-022: Business Model Review page loads with model data
  test('TC-022: business-model-review loads with model data', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/model`);
    await expect(page.locator('h1')).toContainText(/Business Model/i);
  });

  // TC-021: Confidence badge shows "medium" for score 65
  test('TC-021: confidence badge reflects medium tier at score 65', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/model`);
    // Medium confidence: 50-69 range renders a warning-level badge
    await expect(
      page.locator('[data-testid="confidence-badge"], [data-testid*="confidence"]').first(),
    ).toBeVisible();
    // Badge text should indicate score (65) or "medium" label
    const badgeText = await page
      .locator('[data-testid="confidence-badge"], [data-testid*="confidence"]')
      .first()
      .textContent();
    expect(badgeText).toMatch(/65|medium|warning/i);
  });

  // UC-002: Tabs render for Actors, Processes, Systems
  test('business-model-review renders Actors, Processes, Systems tabs', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/model`);
    await expect(page.locator('text=Actors')).toBeVisible();
    await expect(page.locator('text=Processes')).toBeVisible();
    await expect(page.locator('text=Systems')).toBeVisible();
  });

  // ATIA s.23 policy notice visible on business-model-review
  test('ATIA s.23 policy notice is visible', async ({ page }) => {
    await page.goto(`/sessions/${SESSION_ID}/model`);
    // Policy notice for ATIA s.23 or FOIP deliberative process protection
    await expect(
      page.locator('[data-testid="policy-notice"], [data-testid*="atia"], text=/ATIA|FOIP|deliberative/i').first(),
    ).toBeVisible();
  });
});
