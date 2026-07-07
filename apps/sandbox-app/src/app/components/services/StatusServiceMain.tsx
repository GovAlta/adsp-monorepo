import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { Routes } from 'react-router-dom';
import { ServiceMainProps } from './types';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const StatusServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'statusServiceContainer'}
        heading={'Status Service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Status service.
        </GoabText>
        <DefaultServiceListTemplate prefix="Status service item " />
      </GoabContainer>
      <Routes></Routes>
    </ServiceContainer>
  );
};
