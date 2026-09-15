import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { pdfReport } from './registry/services/pdfReport';
import * as registry from './registry/serviceReportRegistry';
import { ServiceReportPage } from './serviceReportPage';
import { LOAD_REPORT_SECTION_ACTION, SET_REPORT_CRITERIA_ACTION } from '@store/serviceReports/actions';
import { registerSectionLoader, resetSectionLoaders } from './registry/serviceReportRegistry';

const mockStore = configureStore([]);

const baseState = {
  config: { featureFlags: {}, serviceUrls: {} },
  session: { resourceAccess: {} },
  serviceReports: {
    criteria: { serviceId: null, period: { preset: 'last30Days', from: '2026-08-12', to: '2026-09-10' } },
    sections: {},
  },
};

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
};

const renderPage = (entry: string, state = baseState) => {
  const store = mockStore(state);
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <LocationProbe />
        <Routes>
          <Route path="/admin/reports" element={<ServiceReportPage />} />
          <Route path="/admin/reports/:serviceId" element={<ServiceReportPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
  return { ...view, store };
};

describe('ServiceReportPage', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetSectionLoaders();
  });

  it('renders sections in the descriptor order', () => {
    const { container } = renderPage('/admin/reports/pdf');
    const sectionIds = Array.from(container.querySelectorAll('goa-container'))
      .map((node) => node.getAttribute('testid'))
      .filter(Boolean);

    expect(sectionIds).toEqual([
      'reports-section-summary',
      'reports-section-trends',
      'reports-section-top-resources',
      'reports-section-insights',
      'reports-section-api-drilldown',
    ]);
  });

  it('shows the not-available callout for an unknown service id', () => {
    renderPage('/admin/reports/not-a-service');

    expect(screen.getByText('Report not available')).toBeInTheDocument();
  });

  it('redirects to the default service when the service id is missing', () => {
    renderPage('/admin/reports');

    expect(screen.getByTestId('location')).toHaveTextContent('/admin/reports/pdf');
  });

  it('hydrates criteria from the period query param', () => {
    const { store } = renderPage('/admin/reports/pdf?preset=last7Days');
    const criteriaAction = store.getActions().find((action) => action.type === SET_REPORT_CRITERIA_ACTION);

    expect(criteriaAction.period.preset).toBe('last7Days');
  });

  it('hydrates a custom period from from and to query params', () => {
    const { store } = renderPage('/admin/reports/pdf?preset=custom&from=2026-01-01&to=2026-03-31');
    const criteriaAction = store.getActions().find((action) => action.type === SET_REPORT_CRITERIA_ACTION);

    expect(criteriaAction.period).toEqual({ preset: 'custom', from: '2026-01-01', to: '2026-03-31' });
  });

  it('falls back to last 30 days when a custom period is missing dates', () => {
    const { store } = renderPage('/admin/reports/pdf?preset=custom');
    const criteriaAction = store.getActions().find((action) => action.type === SET_REPORT_CRITERIA_ACTION);

    expect(criteriaAction.period.preset).toBe('last30Days');
  });

  it('dispatches a section load only when a loader is registered', () => {
    registerSectionLoader('pdf', 'summary', async () => ({ pdfGenerated: 1 }));
    const { store } = renderPage('/admin/reports/pdf');
    const loadActions = store.getActions().filter((action) => action.type === LOAD_REPORT_SECTION_ACTION);

    expect(loadActions).toEqual([
      { type: LOAD_REPORT_SECTION_ACTION, serviceId: 'pdf', sectionId: 'summary' },
    ]);
  });

  it('shows the not-available callout when no default service exists', () => {
    jest.spyOn(registry, 'getDefaultServiceReport').mockReturnValue(undefined);

    renderPage('/admin/reports');

    expect(screen.getByText('Report not available')).toBeInTheDocument();
  });

  it('blocks the report when the required role is absent', () => {
    jest.spyOn(registry, 'getAvailableServiceReports').mockReturnValue([
      { ...pdfReport, requiredRole: 'pdf-reporter' },
    ]);

    const { container } = renderPage('/admin/reports/pdf');

    expect(container.querySelector('goa-callout[testid="reports-role-need-callout"]')).toBeInTheDocument();
  });
});
