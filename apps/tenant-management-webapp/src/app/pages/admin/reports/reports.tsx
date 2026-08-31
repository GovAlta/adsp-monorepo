import { Main } from '@components/Html';
import React, { FunctionComponent } from 'react';
import { ServiceColumnLayoutWithMargin } from '../../admin';

export const Reports: FunctionComponent = () => {
  return (
    <Main>
      <ServiceColumnLayoutWithMargin>
        <h1 data-testid="reports-title">Reports</h1>
      </ServiceColumnLayoutWithMargin>
    </Main>
  );
};
