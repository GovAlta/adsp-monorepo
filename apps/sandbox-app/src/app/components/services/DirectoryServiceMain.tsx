import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { Routes } from 'react-router-dom';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const DirectoryServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'directoryServiceContainer'}
        heading={'Directory Service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Directory service.
        </GoabText>
        <DefaultServiceListTemplate prefix="Directory service item " />
      </GoabContainer>

      <Routes></Routes>
    </ServiceContainer>
  );
};
