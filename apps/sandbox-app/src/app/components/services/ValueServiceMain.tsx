import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer } from '@abgov/react-components';

function ValueServiceMain() {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'valueServiceContainer'}
        heading={'Value service'}
      >
        Status Testing
      </GoabContainer>
    </ServiceContainer>
  );
}

export default ValueServiceMain;
