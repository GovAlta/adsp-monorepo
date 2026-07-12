import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';

import { ServiceMainProps } from './types';

import { ServiceListTemplate } from './ServiceListTemplate';
import { addJsonformsPages } from '../../utils/servicePageUtils';

export const JsonformsMain = ({ tenantName }: ServiceMainProps) => {
  const pages = addJsonformsPages(tenantName);

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'JsonformsContainer'}
        heading={'Jsonforms library'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Jsonforms library.
        </GoabText>
        <ServiceListTemplate servicePages={pages} />
      </GoabContainer>
    </ServiceContainer>
  );
};
