import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchCalendars } from '@store/calendar/actions';
import { CalendarItem, defaultCalendar } from '@store/calendar/models';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAButton } from '@abgov/react-components';

import { CalendarModal } from './calendarModal';
import { CalendarTableComponent } from './calendarList';

import styled from 'styled-components';
interface AddCalendarProps {
  activeEdit: boolean;
}
export const CalendarsView = ({ activeEdit }: AddCalendarProps): JSX.Element => {
  const dispatch = useDispatch();
  const [modalType, setModalType] = useState('');
  const [editCalendar, setEditCalendar] = useState(false);
  const [openAddCalendar, setOpenAddCalendar] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarItem>(defaultCalendar);

  useEffect(() => {
    dispatch(fetchCalendars());
  }, []);

  const tenantName = useSelector((state: RootState) => state.tenant?.name);
  const { calendars } = useSelector((state: RootState) => state.calendarService);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });
  const nameArray = calendars ? calendars.map((a) => a.name) : [];

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddCalendar(true);
    }
  }, [activeEdit]);

  // eslint-disable-next-line
  useEffect(() => {}, [indicator]);
  // eslint-disable-next-line
  useEffect(() => {}, [tenantName]);

  const reset = () => {
    setEditCalendar(false);
    setSelectedCalendar(defaultCalendar);
    setOpenAddCalendar(false);
  };

  const onEdit = (service) => {
    setSelectedCalendar(service);
    setModalType('edit');
    setEditCalendar(true);
  };

  const roles = useSelector((state: RootState) => state.tenant.realmRoles);

  return (
    <>
      <div>
        <GoAButton
          activeEdit={activeEdit}
          data-testid="add-calendar-btn"
          onClick={() => {
            setSelectedCalendar(defaultCalendar);
            setModalType('new');
            setEditCalendar(true);
          }}
        >
          Add Calendar
        </GoAButton>
      </div>
      {indicator.show && <PageIndicator />}
      {!indicator.show && !calendars && renderNoItem('calendar')}
      {!indicator.show && calendars && (
        <div>
          <CalendarTableComponent calendars={calendars} onDelete={reset} onEdit={onEdit} />
        </div>
      )}

      {(editCalendar || openAddCalendar) && (
        <CalendarModal
          open={true}
          calendar={selectedCalendar}
          type={modalType}
          roles={roles}
          onCancel={() => {
            reset();
          }}
          calendarNames={nameArray}
        />
      )}
    </>
  );
};
