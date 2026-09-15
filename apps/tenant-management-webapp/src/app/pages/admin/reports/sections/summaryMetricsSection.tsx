import { GoabGrid } from '@abgov/react-components';
import { RootState } from '@store/index';
import { selectSectionState } from '@store/serviceReports/selectors';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { ReportSectionProps, SummaryMetricFormat } from '../registry/types';
import { SummaryMetricCard, SummaryMetricValue } from '../styled-components';
import { ReportSection } from './reportSection';

/** Formatting by `format` is implemented when section values exist. */
export const formatMetricValue = (_value: unknown, _format: SummaryMetricFormat): string => '-';

export const SummaryMetricsSection: FunctionComponent<ReportSectionProps> = ({ descriptor }) => {
  const state = useSelector((root: RootState) => selectSectionState(descriptor.id, 'summary')(root));

  if (!descriptor.summaryMetrics?.length) {
    return null;
  }

  const values = (state.data ?? {}) as Record<string, unknown>;
  const cards = (
    <GoabGrid minChildWidth="20ch" gap="s" testId="reports-summary-metrics">
      {descriptor.summaryMetrics.map((metric) => (
        <SummaryMetricCard key={metric.id} data-testid={`reports-summary-metric-${metric.id}`}>
          <SummaryMetricValue>{formatMetricValue(values[metric.id], metric.format)}</SummaryMetricValue>
          {metric.label}
        </SummaryMetricCard>
      ))}
    </GoabGrid>
  );

  return (
    <ReportSection title="Summary" testId="reports-section-summary" state={state} placeholder={cards}>
      {cards}
    </ReportSection>
  );
};
