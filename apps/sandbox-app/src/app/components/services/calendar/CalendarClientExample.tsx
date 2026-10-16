import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  GoabButton,
  GoabCallout,
  GoabCircularProgress,
  GoabContainer,
  GoabDetails,
  GoabFormItem,
  GoabInput,
  GoabTable,
  GoabText,
} from '@abgov/react-components';
import { CalendarClient, DateRange, ICalendarClient } from '@abgov/adsp-components-core';
import { useCalendarEvents } from '@abgov/adsp-components-react';
import { directorySelector, getAccessToken } from '../../../state';
import { ServiceContainer } from '../../styled-components';

const CALENDAR_SERVICE_ID = 'urn:ads:platform:calendar-service';
const TIME_ZONE = 'America/Edmonton';

const USAGE = `import { CalendarClient } from '@abgov/adsp-components-core';
import { useCalendarEvents } from '@abgov/adsp-components-react';

// Create the client once; the hook reloads whenever the client, calendar or range changes.
const client = new CalendarClient({
  serviceUrl: 'https://calendar-service.adsp.alberta.ca',
  getAccessToken: async () => token, // Optional; omit with a tenant name for public events.
});

// The range end is exclusive.
const range = {
  start: new Date('2026-05-01T00:00:00-06:00'),
  end: new Date('2026-06-01T00:00:00-06:00'),
};

const { calendarEvents, loading, error } = useCalendarEvents(client, 'my-calendar', range);`;

const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--goa-space-m);
  margin: var(--goa-space-m) 0;
`;

const toDateInputValue = (value: Date) =>
  `${value.getFullYear()}-${`${value.getMonth() + 1}`.padStart(2, '0')}-${`${value.getDate()}`.padStart(2, '0')}`;

// Date inputs yield yyyy-MM-dd; parse as local midnight.
const fromDateInputValue = (value: string) => new Date(`${value}T00:00:00`);

const formatDateTime = (value: Date | null) =>
  value ? value.toLocaleString('en-CA', { timeZone: TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' }) : '';

const formatDate = (value: Date) => value.toLocaleDateString('en-CA', { timeZone: TIME_ZONE, dateStyle: 'full' });

interface CalendarQuery {
  id: number;
  calendar: string;
  range: DateRange;
}

interface CalendarEventsResultsProps {
  client: ICalendarClient;
  calendar: string;
  range: DateRange;
}

const CalendarEventsResults = ({ client, calendar, range }: CalendarEventsResultsProps) => {
  const { calendarEvents, loading, error } = useCalendarEvents(client, calendar, range);

  return (
    <>
      {loading && <GoabCircularProgress variant="inline" size="large" message="Loading..." visible={true} />}

      {error && (
        <GoabCallout type="emergency" heading="Unable to load calendar" mt="m" mb="m">
          {error.message}
        </GoabCallout>
      )}

      {calendarEvents && (
        <>
          <GoabText size="heading-s">Events ({calendarEvents.events.length})</GoabText>
          <GoabTable width="100%" testId="calendar-client-events">
            <thead>
              <tr>
                <th>Name</th>
                <th>Start</th>
                <th>End</th>
                <th>All day</th>
              </tr>
            </thead>
            <tbody>
              {calendarEvents.events.map((event) => (
                <tr key={event.id}>
                  <td>{event.name}</td>
                  <td>{formatDateTime(event.start)}</td>
                  <td>{formatDateTime(event.end)}</td>
                  <td>{event.isAllDay ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </GoabTable>

          <GoabText size="heading-s" mt="l">
            Holidays ({calendarEvents.holidays.length})
          </GoabText>
          <GoabTable width="100%" testId="calendar-client-holidays">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>In lieu of</th>
              </tr>
            </thead>
            <tbody>
              {calendarEvents.holidays.map((holiday) => (
                <tr key={holiday.date.toISOString()}>
                  <td>{formatDate(holiday.date)}</td>
                  <td>{holiday.name}</td>
                  <td>{holiday.isInLieuOfDay ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </GoabTable>
        </>
      )}
    </>
  );
};

export const CalendarClientExample = () => {
  const directory = useSelector(directorySelector);
  const serviceUrl = directory[CALENDAR_SERVICE_ID];

  const now = new Date();
  const [calendar, setCalendar] = useState('');
  const [start, setStart] = useState(toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [end, setEnd] = useState(toDateInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 1)));
  const [query, setQuery] = useState<CalendarQuery>(null);

  const client = useMemo(() => (serviceUrl ? new CalendarClient({ serviceUrl, getAccessToken }) : null), [serviceUrl]);

  const range = start && end ? { start: fromDateInputValue(start), end: fromDateInputValue(end) } : null;
  const isRangeValid = !!range && range.end > range.start;
  const canLoad = !!client && !!calendar.trim() && isRangeValid;

  // A new id remounts the results so loading again with the same inputs retrieves the events again.
  const load = () => setQuery((previous) => ({ id: (previous?.id ?? 0) + 1, calendar: calendar.trim(), range }));

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width="full"
        testId="calendarClientExampleContainer"
        title="Calendar client"
      >
        <GoabText size="body-m" mb="none">
          Retrieves the events and statutory holidays for a date range using the framework-independent CalendarClient.
        </GoabText>

        {!serviceUrl && (
          <GoabCallout type="important" heading="Calendar service not found" mt="m" mb="m">
            The Calendar service is not registered in the directory.
          </GoabCallout>
        )}

        <FormRow>
          <GoabFormItem label="Calendar name" labelSize="compact">
            <GoabInput
              name="calendar"
              value={calendar}
              size="compact"
              placeholder="my-calendar"
              testId="calendar-client-name"
              onChange={(detail) => setCalendar(detail.value)}
            />
          </GoabFormItem>
          <GoabFormItem label="Start" labelSize="compact">
            <GoabInput
              name="start"
              type="date"
              value={start}
              size="compact"
              testId="calendar-client-start"
              onChange={(detail) => setStart(detail.value)}
            />
          </GoabFormItem>
          <GoabFormItem
            label="End (exclusive)"
            labelSize="compact"
            error={!isRangeValid && range ? 'End must be after start.' : undefined}
          >
            <GoabInput
              name="end"
              type="date"
              value={end}
              size="compact"
              testId="calendar-client-end"
              onChange={(detail) => setEnd(detail.value)}
            />
          </GoabFormItem>
          <GoabButton type="primary" size="compact" disabled={!canLoad} testId="calendar-client-load" onClick={load}>
            Load
          </GoabButton>
        </FormRow>

        {client && query && (
          <CalendarEventsResults key={query.id} client={client} calendar={query.calendar} range={query.range} />
        )}

        <GoabDetails heading="Usage" mt="l">
          <pre>{USAGE}</pre>
        </GoabDetails>
      </GoabContainer>
    </ServiceContainer>
  );
};
