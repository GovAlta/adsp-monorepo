import React, { useEffect, useState } from 'react';
import { SelectCalendarHeader, CalendarDropdownWrapper } from './styled-components';
import { GoADropdown, GoADropdownItem, GoAButton, GoASkeleton, GoAButtonGroup } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarObjectType, EventAddEditModalType } from '@store/calendar/models';
import { fetchCalendars, FetchEventsByCalendar, UpdateSearchCalendarEventCriteria } from '@store/calendar/actions';
import { UpdateModalState } from '@store/session/actions';
import { selectCalendars, selectSelectedCalendarEvents } from '@store/calendar/selectors';

import { EventAddEditModal } from './addEditModal';
import { EventList } from './eventList';
import { EventListFilter } from './eventListFilter';
import { RootState } from '@store/index';

interface CalendarDropdownProps {
  calendars: CalendarObjectType;
  onSelect: (name: string, value: string) => void;
}

const CalendarDropdown = ({ calendars, onSelect }: CalendarDropdownProps): JSX.Element => {
  return (
    <CalendarDropdownWrapper>
      <GoADropdown
        name="calendars"
        width="100%"
        placeholder="Select"
        testId="calendar-event-dropdown-list"
        aria-label="select-calendar-dropdown"
        onChange={onSelect}
      >
        {Object.entries(calendars).map(([name, calendar]) => (
          <GoADropdownItem
            label={calendar?.name}
            value={`${calendar.name}`}
            key={name}
            testId={`calendar-dropdown-${name}`}
          />
        ))}
      </GoADropdown>
    </CalendarDropdownWrapper>
  );
};

export const CalendarEvents = (): JSX.Element => {
  const dispatch = useDispatch();
  const [selectedCalendar, setSelectedCalendar] = useState<string>(null);

  const onCalendarSelect = (name: string, value: string) => {
    setSelectedCalendar(value);
    dispatch(FetchEventsByCalendar(value, null));
    dispatch(UpdateSearchCalendarEventCriteria());
  };

  useEffect(() => {
    dispatch(fetchCalendars());
  }, []);

  const calendars = useSelector(selectCalendars);
  const selectedEvents = useSelector((state: RootState) => selectSelectedCalendarEvents(state, selectedCalendar));

  const handleExport = () => {
    const iCalContent = generateICalContent(selectedEvents);
    downloadICalFile(iCalContent, 'events.ics');
  };

  const generateICalContent = (events) => {
    const lines: string[] = [];

    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Example Calendar//EN');

    events.forEach((event, index) => {
      lines.push('BEGIN:VEVENT');
      lines.push(`SUMMARY:${event.name}`);
      lines.push(`DESCRIPTION:${event.description}`);
      lines.push(`LOCATION:${'online'}`);
      lines.push(`DTSTART:${event.start}`);
      lines.push(`DTEND:${event.end}`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\n');
  };

  const downloadICalFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };
  return (
    <div>
      <SelectCalendarHeader>Select a calendar</SelectCalendarHeader>
      {!calendars && <GoASkeleton type="text" key={1}></GoASkeleton>}
      {calendars && <CalendarDropdown calendars={calendars} onSelect={onCalendarSelect} />}
      {calendars && <EventListFilter calenderName={selectedCalendar} />}
      <EventAddEditModal calendarName={selectedCalendar} />
      <GoAButtonGroup alignment="start">
        <GoAButton
          type="primary"
          testId="show-calendar-event-table"
          disabled={!selectedCalendar}
          onClick={() => {
            dispatch(
              UpdateModalState({
                type: EventAddEditModalType,
                id: null,
                isOpen: true,
              })
            );
          }}
        >
          Add event
        </GoAButton>
        <GoAButton
          type="primary"
          testId="show-calendar-event-table"
          disabled={!selectedEvents || selectedEvents?.length === 0}
          onClick={() => {
            handleExport();
          }}
        >
          Export
        </GoAButton>
      </GoAButtonGroup>
      {selectedCalendar && <EventList calendarName={selectedCalendar} />}
    </div>
  );
};
