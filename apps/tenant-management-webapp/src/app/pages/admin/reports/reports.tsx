import { Main } from '@components/Html';
import BetaBadge from '@icons/beta-badge.svg';
import React, { FunctionComponent } from 'react';
import { ServiceColumnLayoutWithMargin } from '../../admin';
import { HeadingDiv } from '../services/styled-components';

export const Reports: FunctionComponent = () => {
  return (
    <Main>
      <ServiceColumnLayoutWithMargin>
        <HeadingDiv>
          <h1 data-testid="reports-title">Reports</h1>
          <img src={BetaBadge} alt="Reports beta" />
        </HeadingDiv>
      </ServiceColumnLayoutWithMargin>
    </Main>
  );
};
