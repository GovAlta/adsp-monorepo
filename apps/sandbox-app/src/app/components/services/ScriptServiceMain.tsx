import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { Routes } from 'react-router-dom';
import { ServiceMainProps } from './types';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const ScriptServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'scriptServiceContainer'}
        heading={'Script Service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Script service.
        </GoabText>
        <DefaultServiceListTemplate prefix="Script service item " />
      </GoabContainer>
      <Routes></Routes>
    </ServiceContainer>
  );
};
