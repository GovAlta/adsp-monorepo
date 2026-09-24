import { RootState } from '@store/index';
import { selectSectionDisplayState } from '@store/serviceReports/selectors';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { ReportSectionProps } from '../registry/types';
import { PlaceholderBlock } from '../styled-components';
import { ReportSection } from './reportSection';

export const TrendsSection: FunctionComponent<ReportSectionProps> = ({ descriptor }) => {
  const state = useSelector((root: RootState) => selectSectionDisplayState(descriptor.id, 'trends')(root));

  return (
    <ReportSection
      title="Trends"
      testId="reports-section-trends"
      state={state}
      placeholder={<PlaceholderBlock $minHeight="20rem" data-testid="reports-trends-placeholder" />}
    />
  );
};
