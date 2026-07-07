import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { Routes } from 'react-router-dom';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const DesignSystemsMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'designSystemsContainer'}
        heading={'Design systems'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Design system ui components.
        </GoabText>
        <DefaultServiceListTemplate prefix="Design systems item " />
      </GoabContainer>

      <Routes></Routes>
    </ServiceContainer>
  );
};
