import { RootState } from '@store/index';
import { selectSectionState } from '@store/serviceReports/selectors';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { ReportSectionProps } from '../registry/types';
import { PlaceholderBlock } from '../styled-components';
import { ReportSection } from './reportSection';

export const ApiDrilldownSection: FunctionComponent<ReportSectionProps> = ({ descriptor }) => {
  const state = useSelector((root: RootState) => selectSectionState(descriptor.id, 'apiDrilldown')(root));

  return (
    <ReportSection
      title="API metrics"
      testId="reports-section-api-drilldown"
      state={state}
      placeholder={<PlaceholderBlock $minHeight="12rem" data-testid="reports-api-drilldown-placeholder" />}
    />
  );
};
