import React, { useEffect, useMemo, useState } from 'react';
import { ServiceContainer } from '../../styled-components';
import {
  GoabBlock,
  GoabButton,
  GoabContainer,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabInput,
  GoabText,
} from '@abgov/react-components';
import { AdspGoACalendar, AdspThemeProvider } from '@abgov/adsp-components-react';
import { AdspThemes, CalendarClient, DateRange } from '@abgov/adsp-components-core';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppDispatch,
  calendarsBusySelector,
  calendarsSelector,
  directorySelector,
  getAccessToken,
  loadCalendars,
} from '../../../state';
import styled from 'styled-components';
import { GoabDropdownOnChangeDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { GoabSpacer } from '@abgov/react-components';

const CALENDAR_SERVICE_ID = 'urn:ads:platform:calendar-service';
interface ADSPGoACalendarExampleProps {
  tenantName: string;
}
const Card = styled.div`
  background-color: var(--goa-color-greyscale-150);
  padding: var(--goa-space-l);
  border-radius: var(--goa-space-s);
`;

const toDateInputValue = (date?: Date) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    : '';
const fromDateInputValue = (value: string) => (value ? new Date(`${value}T00:00:00`) : undefined);

export const ADSPGoACalendarExample = ({ tenantName }: ADSPGoACalendarExampleProps) => {
  const directory = useSelector(directorySelector);
  const calendarServiceUrl = directory[CALENDAR_SERVICE_ID];
  const dispatch = useDispatch<AppDispatch>();
  const calendars = useSelector(calendarsSelector);
  const { loading } = useSelector(calendarsBusySelector);
  const [calendarName, setCalendarName] = useState('');
  const [loadRequest, setLoadRequest] = useState<{ id: number; calendar: string; range: DateRange }>();
  useEffect(() => {
    if (calendarServiceUrl) {
      dispatch(loadCalendars({ tenantName }));
    }
  }, [dispatch, calendarServiceUrl, tenantName]);

  // The calendar opens on the range start, so start at the current month and load one year ahead.
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setDate(start.getDate() - 365);
    const end = new Date(start);
    end.setDate(end.getDate() + 365);
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

  const onLoad = () => {
    if (!client || !calendarName || !dateRange?.start || !dateRange?.end) {
      return;
    }
    setLoadRequest((current) => ({ id: (current?.id ?? 0) + 1, calendar: calendarName, range: dateRange }));
  };

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        testId={'calendarServiceContainer'}
        title={'ADSP FullCalendar'}
      >
        <Card>
          <GoabText size="body-m" mb="xs">
            Select a calendar to see its events and Alberta statutory holidays, rendered with AdspGoACalendar.
          </GoabText>

          <GoabFormItem label="Calendar name" labelSize="compact" mb="xs">
            <GoabDropdown
              name="calendar-name"
              value={calendarName}
              size="compact"
              width="45ch"
              disabled={loading}
              testId="calendar-name-dropdown"
              onChange={(detail: GoabDropdownOnChangeDetail) => setCalendarName(detail.value)}
            >
              {calendars.map(({ name, displayName }) => (
                <GoabDropdownItem key={name} value={name} label={displayName || name} />
              ))}
            </GoabDropdown>
          </GoabFormItem>
          {!calendarServiceUrl && (
            <GoabText size="body-s" mt="m">
              Calendar service is not available in the directory for this environment.
            </GoabText>
          )}
          <GoabSpacer vSpacing="s"></GoabSpacer>
          <GoabBlock direction="row" alignment="start">
            <GoabFormItem label="Start date" labelSize="compact" mr="s">
              <GoabInput
                size="compact"
                type="date"
                width="20ch"
                name="example-start-date"
                value={toDateInputValue(dateRange?.start)}
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
                width="20ch"
                name="example-end-date"
                value={toDateInputValue(dateRange?.end)}
                disabled={false}
                onChange={(detail: GoabInputOnChangeDetail) =>
                  setDateRange((current) => ({ ...current, end: fromDateInputValue(detail.value) }))
                }
              />
            </GoabFormItem>
            <GoabFormItem mt="xl">
              <GoabButton
                size="compact"
                testId="calendar-load-button"
                disabled={!client || !calendarName || !dateRange?.start || !dateRange?.end}
                onClick={onLoad}
              >
                Load
              </GoabButton>
            </GoabFormItem>
          </GoabBlock>
        </Card>
        <GoabSpacer vSpacing="m"></GoabSpacer>
        {client && loadRequest && (
          <AdspThemeProvider theme={AdspThemes.standard}>
            <AdspGoACalendar
              key={loadRequest.id}
              client={client}
              calendar={loadRequest.calendar}
              initialDateRange={loadRequest.range}
              testId="goa-calendar"
            />
          </AdspThemeProvider>
        )}
      </GoabContainer>
    </ServiceContainer>
  );
};
