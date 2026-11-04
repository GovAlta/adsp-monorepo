import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuditEventPage } from './eventPage';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const event = {
  id: 'e1',
  namespace: 'form-app',
  action: 'submit',
  category: 'runtime',
  status: 'success',
  occurredAt: '2026-01-01T00:00:00Z',
  actor: { id: 'user-1' },
  metadata: { reason: 'test' },
};

const renderPage = (roles: string[], selected: Record<string, unknown>) => {
  const store = configureStore([])({
    session: { indicator: { show: false }, resourceAccess: { 'urn:ads:platform:audit-service': { roles } } },
    config: { serviceUrls: {} },
    audit: { selected },
  });
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/events/form-app/e1']}>
        <Routes>
          <Route path="/events/:namespace/:id" element={<AuditEventPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return { store, ...utils };
};

describe('AuditEventPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('loads the event from the URL and shows all of its fields', () => {
    const { store, getByTestId } = renderPage(['audit-reader'], { event, loading: false, notFound: false });
    expect(store.getActions()).toEqual([{ type: 'audit/FETCH_AUDIT_EVENT_ACTION', namespace: 'form-app', id: 'e1' }]);
    expect(getByTestId('audit-event-section-event')).toHaveTextContent('submit');
    expect(getByTestId('audit-event-section-event')).toHaveTextContent('Outcomesuccess');
    expect(getByTestId('audit-event-metadata')).toHaveTextContent('"reason": "test"');
  });

  it('returns to the logs tab', () => {
    const { baseElement } = renderPage(['audit-reader'], { event, loading: false, notFound: false });
    fireEvent(baseElement.querySelector("goa-button[testId='audit-event-back']"), new CustomEvent('_click'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/services/audit/logs');
  });

  it('shows a message when the event does not exist', () => {
    const { baseElement } = renderPage(['audit-reader'], { loading: false, notFound: true });
    expect(baseElement.querySelector("goa-callout[testId='audit-event-not-found']")).toBeInTheDocument();
  });

  it('matches the event id case-insensitively', () => {
    const { getByTestId } = renderPage(['audit-reader'], {
      event: { ...event, id: 'E1' },
      loading: false,
      notFound: false,
    });
    expect(getByTestId('audit-event-section-event')).toHaveTextContent('submit');
  });

  it('shows not found when the loaded event does not match the requested id', () => {
    const { baseElement } = renderPage(['audit-reader'], {
      event: { ...event, id: 'other' },
      loading: false,
      notFound: false,
    });
    expect(baseElement.querySelector("goa-callout[testId='audit-event-not-found']")).toBeInTheDocument();
  });

  it('requires the audit-reader role', () => {
    const { store, baseElement } = renderPage([], { loading: false, notFound: false });
    expect(baseElement.querySelector("goa-callout[testId='audit-role-callout']")).toBeInTheDocument();
    expect(store.getActions()).toEqual([]);
  });
});
