import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ServiceMainProps } from './types';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const PDFServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'pdfServiceContainer'}
        heading={'PDF Service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the PDF service.
        </GoabText>
        <DefaultServiceListTemplate prefix="PDF service item " />
      </GoabContainer>
      <Routes></Routes>
    </ServiceContainer>
  );
};
