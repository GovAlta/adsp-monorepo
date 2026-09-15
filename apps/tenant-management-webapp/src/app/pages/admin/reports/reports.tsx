import { Main } from '@components/Html';
import React, { FunctionComponent } from 'react';
import { ServiceColumnLayoutWithMargin } from '../../admin';
import { alphaBadge } from '../sidebar';
import { ServiceReportPage } from './serviceReportPage';
import { HeadingDiv } from './styled-components';

export const Reports: FunctionComponent = () => (
  <Main>
    <ServiceColumnLayoutWithMargin>
      <HeadingDiv>
        <h1 data-testid="reports-title">Reports</h1>
        {alphaBadge()}
      </HeadingDiv>
      <ServiceReportPage />
    </ServiceColumnLayoutWithMargin>
  </Main>
);
