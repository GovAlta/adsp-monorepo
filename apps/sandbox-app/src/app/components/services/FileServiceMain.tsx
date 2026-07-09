import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
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
    </ServiceContainer>
  );
};
