import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { Routes } from 'react-router-dom';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const EventServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'eventServiceContainer'}
        heading={'Event Service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Event service.
        </GoabText>
        <DefaultServiceListTemplate prefix="Event service item " />
      </GoabContainer>

      <Routes></Routes>
    </ServiceContainer>
  );
};
