import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const CacheServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'cacheServiceContainer'}
        heading={'Cache Service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Cache service.
        </GoabText>
        <DefaultServiceListTemplate prefix="Cache service item " />
      </GoabContainer>
    </ServiceContainer>
  );
};
