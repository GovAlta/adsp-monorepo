import { test, expect } from '@playwright/test';
import { mockPlannerUserAuth } from './fixtures/auth';

/**
 * UC-001: Start Planning Session — multi-page E2E flow.
 * Flow: session-dashboard → new-session-start → planning-session
 * TCs: TC-001, TC-003, TC-004
 */
test.describe('UC-001: Start Planning Session', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock auth before page load
    await mockPlannerUserAuth(page);

    // Mock GET /api/v1/sessions (empty list for a fresh user)
    await page.route('**/api/v1/sessions*', async (route) => {
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

  // TC-001: Navigate to root, redirected to session-dashboard
  test('TC-001: root redirect lands on session-dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/sessions/);
    await expect(page.locator('h1')).toContainText(/Planning Sessions/i);
  });

  // TC-003: Session dashboard shows "Start New Session" entry point
  test('TC-003: session-dashboard renders Start New Session action', async ({ page }) => {
    await page.goto('/sessions');
    await expect(page.locator('[data-testid="start-new-session-btn"], text=Start New Session')).toBeVisible();
  });

  // UC-001 step 2: Click "Start New Session" → navigate to /sessions/new
  test('navigates to /sessions/new on Start New Session click', async ({ page }) => {
    await page.goto('/sessions');
    await page.click('text=Start New Session');
    await expect(page).toHaveURL(/\/sessions\/new/);
  });

  // UC-001 step 3: new-session-start shows INT-001 pending callout
  test('new-session-start renders INT-001 pending notice', async ({ page }) => {
    await page.goto('/sessions/new');
    await expect(
      page.locator('[data-testid="int001-stub-notice"], [role="note"]').first(),
    ).toBeVisible();
  });

  // UC-001 steps 4–6: Fill title, submit, navigate to planning session
  test('TC-003: submitting session title navigates to planning-session page', async ({ page }) => {
    // Mock POST /api/v1/sessions → returns new session id
    await page.route('**/api/v1/sessions', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'e2e-session-1',
            title: 'Test Session E2E',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Mock GET for the new session
    await page.route('**/api/v1/sessions/e2e-session-1**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'e2e-session-1',
          title: 'Test Session E2E',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });
    });

    // Mock GET messages for the planning session
    await page.route('**/api/v1/sessions/e2e-session-1/messages**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, pageSize: 50, totalCount: 0, totalPages: 0 },
        }),
      });
    });

    await page.goto('/sessions/new');
    await page.fill('[data-testid="session-title-input"], input[name="title"]', 'Test Session E2E');
    await page.click('text=Start Planning Session');

    await expect(page).toHaveURL(/\/sessions\/e2e-session-1/);
  });

  // TC-004: Planning session page renders with INT-001 pending banner
  test('TC-004: planning-session renders INT-001 stub banner', async ({ page }) => {
    // Mock session and messages for direct navigation
    await page.route('**/api/v1/sessions/e2e-session-1**', async (route) => {
      if (route.request().url().includes('/messages')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { page: 1, pageSize: 50, totalCount: 0, totalPages: 0 },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'e2e-session-1',
            title: 'Test Session E2E',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });

    await page.goto('/sessions/e2e-session-1/planning');
    await expect(
      page.locator('[data-testid="int001-stub-notice"], [role="note"]').first(),
    ).toBeVisible();
  });

  // TC-004: Send Message button disabled when INT-001 stub active
  test('TC-004: Send Message button disabled under INT-001 stub', async ({ page }) => {
    await page.route('**/api/v1/sessions/e2e-session-1**', async (route) => {
      if (route.request().url().includes('/messages')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            pagination: { page: 1, pageSize: 50, totalCount: 0, totalPages: 0 },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'e2e-session-1',
            title: 'Test Session E2E',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
    });

    await page.goto('/sessions/e2e-session-1/planning');
    const sendBtn = page.locator('[data-testid="send-message-btn"], button:has-text("Send")');
    await expect(sendBtn).toBeDisabled();
  });
});
