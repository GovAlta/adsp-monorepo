import React, { useEffect, useState } from 'react';
import { SelectCalendarHeader } from './styled-components';
import { GoADropdown, GoADropdownItem, GoAButton } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarObjectType, EventAddEditModalType } from '@store/calendar/models';
import { fetchCalendars, FetchEventsByCalendar } from '@store/calendar/actions';
import { UpdateModalState } from '@store/session/actions';
import { selectCalendars } from '@store/calendar/selectors';
import { EventAddEditModal } from './addEditModal';
import { EventList } from './eventList';

interface CalendarDropdownProps {
  calendars: CalendarObjectType;
  onSelect: (name: string, value: string) => void;
}

const CalendarDropdown = ({ calendars, onSelect }: CalendarDropdownProps): JSX.Element => {
  return (
    <GoADropdown name="calendars" width="100%" value={'red'} aria-label="select-calendar-dropdown" onChange={onSelect}>
      {Object.entries(calendars).map(([name, calendar]) => (
        <GoADropdownItem
          label={calendar?.name}
          value={`${calendar.name}`}
          key={name}
          testId={`calendar-dropdown-${name}`}
        />
      ))}
    </GoADropdown>
  );
};

export const CalendarEvents = (): JSX.Element => {
  const dispatch = useDispatch();
  const [selectedCalendar, setSelectedCalendar] = useState<string>(null);

  const onCalendarSelect = (name: string, value: string) => {
    setSelectedCalendar(value);
    dispatch(FetchEventsByCalendar(value));
  };

  useEffect(() => {
    dispatch(fetchCalendars());
  }, []);

  const calendars = useSelector(selectCalendars);

  return (
    <>
      <SelectCalendarHeader>Please select a calendar</SelectCalendarHeader>
      {calendars && <CalendarDropdown calendars={calendars} onSelect={onCalendarSelect} />}
      <EventAddEditModal />
      <br /> <br />
      <GoAButton
        type="primary"
        testId="show-calendar-event-table"
        disabled={selectedCalendar === null}
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
      {selectedCalendar && <EventList calendarName={selectedCalendar} />}
    </>
  );
};
