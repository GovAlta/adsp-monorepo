import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const TaskServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'taskServiceContainer'}
        heading={'Task service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Task service.
        </GoabText>
        <DefaultServiceListTemplate prefix="Task service item " />
      </GoabContainer>
    </ServiceContainer>
  );
};
