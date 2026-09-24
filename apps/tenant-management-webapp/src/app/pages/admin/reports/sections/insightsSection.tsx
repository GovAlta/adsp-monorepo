import { RootState } from '@store/index';
import { selectSectionDisplayState } from '@store/serviceReports/selectors';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { ReportSectionProps } from '../registry/types';
import { PlaceholderBlock } from '../styled-components';
import { ReportSection } from './reportSection';

export const InsightsSection: FunctionComponent<ReportSectionProps> = ({ descriptor }) => {
  const state = useSelector((root: RootState) => selectSectionDisplayState(descriptor.id, 'insights')(root));

  return (
    <ReportSection
      title="Insights"
      testId="reports-section-insights"
      state={state}
      placeholder={<PlaceholderBlock $minHeight="8rem" data-testid="reports-insights-placeholder" />}
    />
  );
};
