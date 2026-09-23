import { RootState } from '@store/index';
import { selectSectionDisplayState } from '@store/serviceReports/selectors';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { ReportSectionProps } from '../registry/types';
import { PlaceholderBlock } from '../styled-components';
import { ReportSection } from './reportSection';

export const TopResourcesSection: FunctionComponent<ReportSectionProps> = ({ descriptor }) => {
  const state = useSelector((root: RootState) => selectSectionDisplayState(descriptor.id, 'topResources')(root));
  const title = descriptor.topResourcesLabel ? `Top ${descriptor.topResourcesLabel}` : 'Top resources';

  return (
    <ReportSection
      title={title}
      testId="reports-section-top-resources"
      state={state}
      placeholder={<PlaceholderBlock $minHeight="8rem" data-testid="reports-top-resources-placeholder" />}
    />
  );
};
