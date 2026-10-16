import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { DefaultServiceListTemplate } from './DefaultServiceListTemplate';

export const CalendarServiceMain = ({ tenantName }: ServiceMainProps) => {
  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'calendarServiceContainer'}
        heading={'Calendar Service'}
      >
        <GoabText size="body-m" mb="none">
          The following contains POC or samples for the Calendar service.
        </GoabText>
        <DefaultServiceListTemplate prefix="Calendar service item " />
      </GoabContainer>
    </ServiceContainer>
  );
};
