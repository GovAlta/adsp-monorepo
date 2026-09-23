import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { pdfReport } from '../registry/services/pdfReport';
import { formatMetricValue, SummaryMetricsSection } from './summaryMetricsSection';

const mockStore = configureStore([]);

const criteria = { serviceId: 'pdf', period: { preset: 'last30Days', from: '2026-08-12', to: '2026-09-10' } };

const renderWithSection = (section: Record<string, unknown>) => {
  const store = mockStore({
    serviceReports: {
      criteria,
      sections: { pdf: { summary: section } },
    },
  });
  return render(
    <Provider store={store}>
      <SummaryMetricsSection descriptor={pdfReport} />
    </Provider>
  );
};

describe('formatMetricValue', () => {
  it('formats a count as a rounded integer', () => {
    expect(formatMetricValue(15, 'count')).toBe('15');
  });

  it('formats a whole-second duration with a unit', () => {
    expect(formatMetricValue(3, 'duration')).toBe('3 s');
  });

  it('formats a fractional duration to one decimal', () => {
    expect(formatMetricValue(2.91, 'duration')).toBe('2.9 s');
  });

  it('formats zero counts as 0', () => {
    expect(formatMetricValue(0, 'count')).toBe('0');
  });

  it('formats a missing value as an em dash', () => {
    expect(formatMetricValue(undefined, 'count')).toBe('—');
  });
});

describe('SummaryMetricsSection', () => {
  it('renders the summary heading when status is idle', () => {
    renderWithSection({ status: 'idle', data: null });

    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('renders nothing when the descriptor has no summary metrics', () => {
    const store = mockStore({
      serviceReports: { criteria, sections: {} },
    });
    const { container } = render(
      <Provider store={store}>
        <SummaryMetricsSection descriptor={{ ...pdfReport, summaryMetrics: [] }} />
      </Provider>
    );

    expect(container.querySelector('[testid="reports-section-summary"]')).not.toBeInTheDocument();
  });

  it('renders the summary section test id when status is idle', () => {
    const { container } = renderWithSection({ status: 'idle', data: null });

    expect(container.querySelector('[testid="reports-section-summary"]')).toBeInTheDocument();
  });

  it('renders formatted values when the section is loaded', () => {
    renderWithSection({
      status: 'loaded',
      data: {
        pdfRequested: 15,
        pdfGenerated: 11,
        pdfFailed: 4,
        unreconciled: 0,
        generationDuration: 2.9,
        generationDurationMax: 4,
        templatesUsed: 6,
      },
    });

    expect(screen.getByTestId('reports-summary-metric-pdfGenerated')).toHaveTextContent('11');
    expect(screen.getByTestId('reports-summary-metric-generationDuration')).toHaveTextContent('2.9 s');
    expect(screen.getByTestId('reports-summary-metric-unreconciled')).toHaveTextContent('0');
  });

  it('renders a skeleton for each summary card while loading', () => {
    const { container } = renderWithSection({ status: 'loading', data: null });

    expect(container.querySelector('[testid="reports-summary-metrics-skeleton"]')).toBeInTheDocument();
    expect(container.querySelectorAll('goa-skeleton')).toHaveLength(pdfReport.summaryMetrics?.length ?? 0);
  });

  it('renders an error callout and dashes in the cards when loading fails', () => {
    const { container } = renderWithSection({
      status: 'error',
      data: null,
      error: 'Something went wrong. Try again.',
    });

    expect(container.querySelector('goa-callout[heading="Something went wrong"]')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong. Try again.')).toBeInTheDocument();
    expect(screen.getByTestId('reports-summary-metric-pdfGenerated')).toHaveTextContent('—');
  });

  it('renders the empty-period message when loaded data is null', () => {
    renderWithSection({ status: 'loaded', data: null });

    expect(screen.getByText('No data for the selected period')).toBeInTheDocument();
  });
});
