import React from 'react';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceContainer } from '../styled-components';
import { ServiceMainProps } from './types';
import { addAdspComponentsPages } from '../../utils/servicePageUtils';
import { ServiceListTemplate } from './ServiceListTemplate';

export const AdspComponentsMain = ({ tenantName }: ServiceMainProps) => {
  const pages = addAdspComponentsPages(tenantName);

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'adspComponentsContainer'}
        heading={'ADSP components'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the ADSP application components libraries.
        </GoabText>
        <ServiceListTemplate servicePages={pages} />
      </GoabContainer>
    </ServiceContainer>
  );
};
