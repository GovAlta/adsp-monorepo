import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer } from '@abgov/react-components';

function AgentServiceMain() {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'agentServiceContainer'}
        heading={'Agent Service'}
      >
        Testing
      </GoabContainer>
    </ServiceContainer>
  );
}

export default AgentServiceMain;
