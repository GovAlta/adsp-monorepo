import { GoabGrid, GoabSkeleton } from '@abgov/react-components';
import { RootState } from '@store/index';
import { selectSectionDisplayState } from '@store/serviceReports/selectors';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { ReportSectionProps, SummaryMetricFormat } from '../registry/types';
import { SummaryMetricCard, SummaryMetricValue } from '../styled-components';
import { ReportSection } from './reportSection';

const ERROR_VALUE = '—';

export const formatMetricValue = (value: unknown, format: SummaryMetricFormat): string => {
  if (value === null || value === undefined || value === '') {
    return ERROR_VALUE;
  }

  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return ERROR_VALUE;
  }

  if (format === 'duration') {
    return Number.isInteger(n) ? `${n} s` : `${n.toFixed(1)} s`;
  }

  if (format === 'percent') {
    return Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;
  }

  return String(Math.round(n));
};

export const SummaryMetricsSection: FunctionComponent<ReportSectionProps> = ({ descriptor }) => {
  const state = useSelector((root: RootState) => selectSectionDisplayState(descriptor.id, 'summary')(root));

  if (!descriptor.summaryMetrics?.length) {
    return null;
  }

  const values = (state.data ?? {}) as Record<string, unknown>;
  const showErrorValue = state.status === 'error';
  const cards = (
    <GoabGrid minChildWidth="20ch" gap="s" testId="reports-summary-metrics">
      {descriptor.summaryMetrics.map((metric) => (
        <SummaryMetricCard key={metric.id} data-testid={`reports-summary-metric-${metric.id}`}>
          <SummaryMetricValue>
            {showErrorValue ? ERROR_VALUE : formatMetricValue(values[metric.id], metric.format)}
          </SummaryMetricValue>
          {metric.label}
        </SummaryMetricCard>
      ))}
    </GoabGrid>
  );
  const loading = (
    <GoabGrid minChildWidth="20ch" gap="s" testId="reports-summary-metrics-skeleton">
      {descriptor.summaryMetrics.map((metric) => (
        <SummaryMetricCard key={metric.id} data-testid={`reports-summary-metric-${metric.id}-skeleton`}>
          <GoabSkeleton type="text" testId={`reports-summary-metric-${metric.id}-skeleton-value`} />
        </SummaryMetricCard>
      ))}
    </GoabGrid>
  );

  return (
    <ReportSection
      title="Summary"
      testId="reports-section-summary"
      state={state}
      placeholder={cards}
      loading={loading}
    >
      {cards}
    </ReportSection>
  );
};
