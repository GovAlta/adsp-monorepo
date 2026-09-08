import { Main } from '@components/Html';
import React, { FunctionComponent } from 'react';
import { ServiceColumnLayoutWithMargin } from '../../admin';
import { HeadingDiv } from '../services/styled-components';
import { alphaBadge } from '../sidebar';

export const Reports: FunctionComponent = () => {
  return (
    <Main>
      <ServiceColumnLayoutWithMargin>
        <HeadingDiv>
          <h1 data-testid="reports-title">Reports</h1>
          {alphaBadge()}
        </HeadingDiv>
      </ServiceColumnLayoutWithMargin>
    </Main>
  );
};
