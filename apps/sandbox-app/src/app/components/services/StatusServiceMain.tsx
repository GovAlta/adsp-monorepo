import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer } from '@abgov/react-components';

function StatusServiceMain() {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'statusServiceContainer'}
        heading={'Status Service'}
      >
        Status Testing
      </GoabContainer>
    </ServiceContainer>
  );
}

export default StatusServiceMain;
