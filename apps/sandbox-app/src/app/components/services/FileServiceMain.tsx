import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ServiceMainProps } from './types';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const FileServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'fileServiceContainer'}
        heading={'File Service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the File service.
        </GoabText>
        <DefaultServiceListTemplate prefix="File service item " />
      </GoabContainer>
      <Routes>{/* <Route path="/" element={<Navigate to={`/${tenantName}/services`} replace />} /> */}</Routes>
    </ServiceContainer>
  );
};
