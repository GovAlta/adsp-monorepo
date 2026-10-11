import { test, expect } from '@playwright/test';
import { mockPlannerUserAuth } from './fixtures/auth';

/**
 * UC-006: Resume Session — multi-page E2E flow.
 * Flow: session-dashboard (existing session) → planning-session (resume)
 * TCs: TC-002, TC-008, TC-018
 */
test.describe('UC-006: Resume Session', () => {
  const ACTIVE_SESSION_ID = 'e2e-session-active-001';
  const PAUSED_SESSION_ID = 'e2e-session-paused-001';

  // Date > 7 days ago to trigger stale context callout
  const STALE_DATE = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

  test.beforeEach(async ({ page }) => {
    await mockPlannerUserAuth(page);

    // Mock GET /api/v1/sessions — list with two sessions
    await page.route('**/api/v1/sessions*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: ACTIVE_SESSION_ID,
                title: 'Active Permit Session',
                status: 'active',
                createdAt: STALE_DATE,
                updatedAt: STALE_DATE, // last activity > 7 days ago
              },
              {
                id: PAUSED_SESSION_ID,
                title: 'Paused Grant Session',
                status: 'paused',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              },
            ],
            pagination: { page: 1, pageSize: 10, totalCount: 2, totalPages: 1 },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET individual active session
    await page.route(`**/api/v1/sessions/${ACTIVE_SESSION_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: ACTIVE_SESSION_ID,
          title: 'Active Permit Session',
          status: 'active',
          createdAt: STALE_DATE,
          updatedAt: STALE_DATE,
        }),
      });
    });

    // Mock GET messages for the active session
    await page.route(`**/api/v1/sessions/${ACTIVE_SESSION_ID}/messages**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'msg-001',
              sessionId: ACTIVE_SESSION_ID,
              role: 'user',
              content: 'We need help with permit applications.',
              createdAt: STALE_DATE,
            },
            {
              id: 'msg-002',
              sessionId: ACTIVE_SESSION_ID,
              role: 'assistant',
              content: 'I understand. Let me analyze your situation.',
              createdAt: STALE_DATE,
            },
          ],
          pagination: { page: 1, pageSize: 50, totalCount: 2, totalPages: 1 },
        }),
      });
    });
  });

  // TC-002: Session dashboard lists both sessions (active and paused)
  test('TC-002: session-dashboard shows existing sessions list', async ({ page }) => {
    await page.goto('/sessions');
    await expect(page.locator('text=Active Permit Session')).toBeVisible();
    await expect(page.locator('text=Paused Grant Session')).toBeVisible();
  });

  // UC-006 step 2: Click "Resume" on active session
  test('clicking Resume on active session navigates to planning-session', async ({ page }) => {
    await page.goto('/sessions');
    // Find the Resume button for the active session
    await page.click('[data-testid*="resume"]:first-of-type, text=Resume');
    await expect(page).toHaveURL(new RegExp(`/sessions/${ACTIVE_SESSION_ID}`));
  });

  // TC-008: Planning session loads with prior message history
  test('TC-008: planning-session loads with prior message history', async ({ page }) => {
    await page.goto(`/sessions/${ACTIVE_SESSION_ID}/planning`);
    await expect(page.locator('text=We need help with permit applications.')).toBeVisible();
  });

  // UC-006: Context summary sidebar shows session title and status
  test('context summary sidebar shows session title and status', async ({ page }) => {
    await page.goto(`/sessions/${ACTIVE_SESSION_ID}/planning`);
    // Context summary area (sidebar)
    await expect(
      page.locator('[data-testid="context-summary"], aside').first(),
    ).toContainText(/Active Permit Session/i);
  });

  // TC-018: 7-day stale session shows stale context callout
  test('TC-018: stale session (>7 days) shows stale context warning callout', async ({ page }) => {
    await page.goto(`/sessions/${ACTIVE_SESSION_ID}/planning`);
    // Stale context callout should be visible for sessions last active > 7 days ago
    await expect(
      page.locator(
        '[data-testid="stale-context-callout"], [data-testid*="stale"], text=/context may be outdated|stale/i',
      ).first(),
    ).toBeVisible();
  });

  // FAC-S5-026: No session content written to localStorage
  test('FAC-S5-026: no session content in localStorage after resume', async ({ page }) => {
    await page.goto(`/sessions/${ACTIVE_SESSION_ID}/planning`);
    const storageItem = await page.evaluate(() => localStorage.getItem('sessionData'));
    expect(storageItem).toBeNull();
  });
});
