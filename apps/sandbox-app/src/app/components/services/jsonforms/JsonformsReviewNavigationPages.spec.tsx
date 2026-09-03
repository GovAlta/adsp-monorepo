import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { JsonformsReviewNavigationPages } from './JsonformsReviewNavigationPages';

// This one renders the real renderers rather than mocking them: the whole question the page exists
// to answer is whether a target survives a route switch and lands the form on the right page, and
// a mocked JsonForms cannot answer it.
window.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: true,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));

class MockResizeObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}
global.ResizeObserver = MockResizeObserver as never;
Element.prototype.scrollIntoView = jest.fn();

const BASE = '/autotest/services/jsonforms/review-navigation-pages';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/:tenant/services/jsonforms/review-navigation-pages/*"
          element={<JsonformsReviewNavigationPages />}
        />
      </Routes>
    </MemoryRouter>,
  );

// The web components take a custom event, not a DOM click.
const clickGoab = (element: Element) => fireEvent(element, new CustomEvent('_click'));

// GoabButton renders a goa-button web component, whose testId lands on a `testid` attribute rather
// than the `data-testid` getByTestId looks for.
const goabButton = (root: Element, testId: string): Element => {
  const button = root.querySelector(`goa-button[testid="${testId}"]`);
  if (!button) {
    throw new Error(`no goa-button with testid ${testId}`);
  }
  return button;
};

const changeButtons = (root: Element) =>
  Array.from(root.querySelectorAll('goa-button')).filter((b) => b.textContent?.trim() === 'Change');

const activePage = (root: Element): string | undefined =>
  root.querySelector('[data-testid$="-content-pages"]')?.getAttribute('data-testid') ?? undefined;

describe('JsonformsReviewNavigationPages', () => {
  it('opens on the summary, with the form not mounted', () => {
    const { baseElement } = renderAt(`${BASE}/summary`);

    expect(screen.getByTestId('summary-route')).toBeInTheDocument();
    expect(screen.queryByTestId('form-route')).not.toBeInTheDocument();
    expect(changeButtons(baseElement).length).toBeGreaterThan(0);
  });

  it('lands the form on the page owning the answer after the route switch', () => {
    const { baseElement } = renderAt(`${BASE}/summary`);

    // The third Change belongs to the applicant's first name, on category index 2.
    clickGoab(changeButtons(baseElement)[2]);

    expect(screen.getByTestId('form-route')).toBeInTheDocument();
    expect(activePage(baseElement)).toBe('step_2-content-pages');
  });

  it('records what was reported and what the form answered', () => {
    const { baseElement } = renderAt(`${BASE}/summary`);

    clickGoab(changeButtons(baseElement)[2]);

    const rows = screen.getAllByTestId('review-change-log-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('#/properties/applicantContactDetails/properties/firstName');
    expect(rows[0]).toHaveTextContent('navigated to page-3');
  });

  it('opens the form on its task list when no target was set', () => {
    const { baseElement } = renderAt(`${BASE}/summary`);

    clickGoab(goabButton(baseElement, 'goto-form'));

    expect(screen.getByTestId('form-route')).toBeInTheDocument();
    expect(activePage(baseElement)).toBeUndefined();
  });

  it('does not re-apply a spent target when the form is opened again', () => {
    const { baseElement } = renderAt(`${BASE}/summary`);

    clickGoab(changeButtons(baseElement)[2]);
    expect(activePage(baseElement)).toBe('step_2-content-pages');

    clickGoab(goabButton(baseElement, 'goto-summary'));
    clickGoab(goabButton(baseElement, 'goto-form'));

    // Cleared in onNavigationChange, so the plain link is not hijacked by the earlier request.
    expect(activePage(baseElement)).toBeUndefined();
  });

  it('honours the same Change a second time', () => {
    const { baseElement } = renderAt(`${BASE}/summary`);

    clickGoab(changeButtons(baseElement)[2]);
    expect(activePage(baseElement)).toBe('step_2-content-pages');

    clickGoab(goabButton(baseElement, 'goto-summary'));
    clickGoab(changeButtons(baseElement)[2]);

    expect(activePage(baseElement)).toBe('step_2-content-pages');
    expect(screen.getAllByTestId('review-change-log-row')).toHaveLength(2);
  });

  it('sends a different Change to a different page', () => {
    const { baseElement } = renderAt(`${BASE}/summary`);

    clickGoab(changeButtons(baseElement)[16]);

    expect(activePage(baseElement)).toBe('step_4-content-pages');
  });
});
