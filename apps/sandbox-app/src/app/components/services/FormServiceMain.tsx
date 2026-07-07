import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { Routes } from 'react-router-dom';
import { ServiceMainProps } from './types';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const FormServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'formServiceContainer'}
        heading={'Form service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Form service.
        </GoabText>
        <DefaultServiceListTemplate prefix="Form service item " />
      </GoabContainer>
      <Routes></Routes>
    </ServiceContainer>
  );
};
