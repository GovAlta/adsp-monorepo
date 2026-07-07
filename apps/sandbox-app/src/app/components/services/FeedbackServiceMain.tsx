import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer } from '@abgov/react-components';

function FeedbackServiceMain() {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'feedbackServiceContainer'}
        heading={'Feedback Service'}
      >
        Feedback Testing
      </GoabContainer>
    </ServiceContainer>
  );
}

export default FeedbackServiceMain;
