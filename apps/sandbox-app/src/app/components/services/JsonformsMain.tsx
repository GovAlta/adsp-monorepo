import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer } from '@abgov/react-components';

function JsonformsMain() {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'JsonformsContainer'}
        heading={'Jsonforms library'}
      >
        Jsonforms Testing
      </GoabContainer>
    </ServiceContainer>
  );
}

export default JsonformsMain;
