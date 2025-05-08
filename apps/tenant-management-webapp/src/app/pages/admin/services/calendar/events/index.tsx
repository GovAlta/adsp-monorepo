import React, { useEffect, useState, useRef } from 'react';
import { SelectCalendarHeader, CalendarDropdownWrapper } from './styled-components';
import { GoADropdown, GoADropdownItem, GoAButton, GoASkeleton } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarObjectType, EventAddEditModalType } from '@store/calendar/models';
import {
  fetchCalendars,
  FetchEventsByCalendar,
  UpdateSearchCalendarEventCriteria,
  ExportCalendarEventsAction,
} from '@store/calendar/actions';
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
  const urlParams = new URLSearchParams(window.location.search);
  const eventName = urlParams.get('event');
  const hasRunRef = useRef(0);
  useEffect(() => {
    if (hasRunRef.current < 5 && Object.keys(calendars).length > 0 && eventName) {
      onSelect('calendars', eventName);
      hasRunRef.current = hasRunRef.current + 1;
    }
  }, [calendars, eventName, onSelect]);

  return (
    <CalendarDropdownWrapper>
      <GoADropdown
        name="calendars"
        width="100%"
        placeholder="Select"
        value={eventName || ''}
        testId="calendar-event-dropdown-list"
        aria-label="select-calendar-dropdown"
        onChange={onSelect}
        relative={true}
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
  const [willExport, setWillExport] = useState(false);
  const { exportEvents } = useSelector((state: RootState) => ({
    exportEvents: state.calendarService?.export,
  }));

  const onCalendarSelect = (name: string, value: string) => {
    setSelectedCalendar(value);
    dispatch(FetchEventsByCalendar(value, null));
    dispatch(UpdateSearchCalendarEventCriteria());
  };

  useEffect(() => {
    dispatch(fetchCalendars());
  }, [dispatch]);

  useEffect(() => {
    if (exportEvents && willExport) {
      downloadICalFile(exportEvents, 'events.ics');
    }
  }, [exportEvents, willExport]);

  const calendarsData = useSelector(selectCalendars);

  const calendars =
    calendarsData && Object.fromEntries(Object.entries(calendarsData).sort(([a], [b]) => a.localeCompare(b)));
  const selectedEvents = useSelector((state: RootState) => selectSelectedCalendarEvents(state, selectedCalendar));

  const handleExport = () => {
    setWillExport(true);
    dispatch(ExportCalendarEventsAction(selectedCalendar, selectedEvents?.length));
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
      {calendars && (
        <>
          <CalendarDropdown calendars={calendars} onSelect={onCalendarSelect} />
          <br />
          <GoAButton
            type="primary"
            testId="add-calendar-event-button"
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
          {calendars && <EventListFilter calenderName={selectedCalendar} />}
          <EventAddEditModal calendarName={selectedCalendar} />

          <GoAButton
            type="secondary"
            testId="export-calendar-event-button"
            disabled={!selectedEvents || selectedEvents?.length === 0}
            onClick={() => {
              handleExport();
            }}
          >
            Export
          </GoAButton>
        </>
      )}
      {selectedCalendar && <EventList calendarName={selectedCalendar} />}
    </div>
  );
};
