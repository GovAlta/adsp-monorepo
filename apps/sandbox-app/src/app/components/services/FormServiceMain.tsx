import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer } from '@abgov/react-components';

function FormServiceMain() {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'formServiceContainer'}
        heading={'Form Service'}
      >
        Testing
      </GoabContainer>
    </ServiceContainer>
  );
}

export default FormServiceMain;
