import React from 'react';
import { ServiceContainer } from '../styled-components';
import { GoabContainer, GoabText } from '@abgov/react-components';
import { ServiceMainProps } from './types';
import { ServiceListTemplate } from './ServiceListTemplate';
import { addCalendarServicePages } from '../../utils/servicePageUtils';

export const CalendarServiceMain = ({ tenantName }: ServiceMainProps) => {
  const pages = addCalendarServicePages(tenantName);

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
        <ServiceListTemplate servicePages={pages} />
      </GoabContainer>
    </ServiceContainer>
  );
};
