import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { pdfReport } from '../registry/services/pdfReport';
import { SummaryMetricsSection } from './summaryMetricsSection';

const mockStore = configureStore([]);

const store = mockStore({
  serviceReports: {
    criteria: { serviceId: 'pdf', period: { preset: 'last30Days', from: '2026-08-12', to: '2026-09-10' } },
    sections: {},
  },
});

describe('SummaryMetricsSection', () => {
  it('renders the summary heading when status is idle', () => {
    render(
      <Provider store={store}>
        <SummaryMetricsSection descriptor={pdfReport} />
      </Provider>
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('renders nothing when the descriptor has no summary metrics', () => {
    const { container } = render(
      <Provider store={store}>
        <SummaryMetricsSection descriptor={{ ...pdfReport, summaryMetrics: [] }} />
      </Provider>
    );

    expect(container.querySelector('[testid="reports-section-summary"]')).not.toBeInTheDocument();
  });

  it('renders the summary section test id when status is idle', () => {
    const { container } = render(
      <Provider store={store}>
        <SummaryMetricsSection descriptor={pdfReport} />
      </Provider>
    );

    expect(container.querySelector('[testid="reports-section-summary"]')).toBeInTheDocument();
  });
});
