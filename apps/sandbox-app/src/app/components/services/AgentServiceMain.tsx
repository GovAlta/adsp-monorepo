import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const AgentServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'agentServiceContainer'}
        heading={'Agent Service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the agent service.
        </GoabText>
        <DefaultServiceListTemplate prefix="Agent item " />
      </GoabContainer>

      <Routes>{/* <Route path="/" element={<Navigate to={`/${tenantName}/services`} replace />} /> */}</Routes>
    </ServiceContainer>
  );
};
