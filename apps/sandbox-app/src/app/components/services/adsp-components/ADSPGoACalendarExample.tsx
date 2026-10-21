import React, { useMemo, useState } from 'react';
import { ServiceContainer } from '../../styled-components';
import { GoabContainer, GoabFormItem, GoabInput, GoabText } from '@abgov/react-components';
import { AdspGoACalendar } from '@abgov/adsp-components-react';
import { CalendarClient, DateRange } from '@abgov/adsp-components-core';
import { useSelector } from 'react-redux';
import { directorySelector, getAccessToken } from '../../../state';
import styled from 'styled-components';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { GoabSpacer } from '@abgov/react-components-ds1';

const CALENDAR_SERVICE_ID = 'urn:ads:platform:calendar-service';
interface ADSPGoACalendarExampleProps {
  tenantName: string;
}

const CalendarWrapper = styled.div`
  flex: 1 1 100%;
  min-width: 0;
`;

const DateFlexItem = styled.div`
  display: flex;
  flex-direction: row;
`;

const toDateInputValue = (date?: Date) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';
const fromDateInputValue = (value: string) => (value ? new Date(`${value}T00:00:00`) : undefined);

export const ADSPGoACalendarExample = ({ tenantName }: ADSPGoACalendarExampleProps) => {
  const directory = useSelector(directorySelector);
  const calendarServiceUrl = directory[CALENDAR_SERVICE_ID];
  const [calendarName, setCalendarName] = useState('');

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 365);
    return { start, end };
  });
  // Stable across renders so AdspGoACalendar doesn't reload events on every render.
  const client = useMemo(
    () =>
      calendarServiceUrl
        ? new CalendarClient({ serviceUrl: calendarServiceUrl, tenant: tenantName, getAccessToken })
        : null,
    [calendarServiceUrl, tenantName],
  );

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        testId={'calendarServiceContainer'}
        title={'ADSP FullCalendar'}
      >
        <GoabText size="body-m" mb="xs">
          Enter the name of a calendar to see its events and Alberta statutory holidays, rendered with AdspGoACalendar.
        </GoabText>

        <GoabFormItem label="Calendar name" labelSize="compact" mb="xs">
          <GoabInput
            name="calendar-name"
            value={calendarName}
            size="compact"
            width="50%"
            testId="calendar-name-input"
            onChange={(detail) => setCalendarName(detail.value)}
          />
        </GoabFormItem>
        {!calendarServiceUrl && (
          <GoabText size="body-s" mt="m">
            Calendar service is not available in the directory for this environment.
          </GoabText>
        )}
        <GoabSpacer vSpacing="s"></GoabSpacer>
        <DateFlexItem>
          <GoabFormItem label="Start date" labelSize="compact" mb="l" mr="s">
            <GoabInput
              size="compact"
              type="date"
              name="example-start-date"
              value={toDateInputValue(dateRange.start)}
              disabled={false}
              onChange={(detail: GoabInputOnChangeDetail) =>
                setDateRange((current) => ({ ...current, start: fromDateInputValue(detail.value) }))
              }
            />
          </GoabFormItem>
          <GoabFormItem label="End date" labelSize="compact" mb="l">
            <GoabInput
              size="compact"
              type="date"
              name="example-end-date"
              value={toDateInputValue(dateRange.end)}
              disabled={false}
              onChange={(detail: GoabInputOnChangeDetail) =>
                setDateRange((current) => ({ ...current, end: fromDateInputValue(detail.value) }))
              }
            />
          </GoabFormItem>
        </DateFlexItem>

        {client && calendarName && (
          <AdspGoACalendar client={client} calendar={calendarName} initialDateRange={dateRange} testId="goa-calendar" />
        )}
      </GoabContainer>
    </ServiceContainer>
  );
};
