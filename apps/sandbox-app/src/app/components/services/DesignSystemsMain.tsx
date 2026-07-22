import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { addDesignSystemPages } from '../../utils/servicePageUtils';
import { ServiceListTemplate } from './ServiceListTemplate';

export const DesignSystemsMain = ({ tenantName }: ServiceMainProps) => {
  const pages = addDesignSystemPages(tenantName);

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
        <ServiceListTemplate servicePages={pages} />
      </GoabContainer>
    </ServiceContainer>
  );
};
