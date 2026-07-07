import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer } from '@abgov/react-components';

function NotificationServiceMain() {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'notificationServiceContainer'}
        heading={'Notification Service'}
      >
        Testing
      </GoabContainer>
    </ServiceContainer>
  );
}

export default NotificationServiceMain;
