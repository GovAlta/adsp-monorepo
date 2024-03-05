import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchCalendars, UpdateCalendar, FETCH_CALENDARS_ACTION } from '@store/calendar/actions';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAButton } from '@abgov/react-components-new';
import { CalendarModal } from './calendarModal';
import { CalendarTableComponent } from './calendarList';
import { fetchEventStreams } from '@store/stream/actions';
import { ActionState } from '@store/session/models';

interface AddEditCalendarProps {
  activeEdit: boolean;
}
export const CalendarsView = ({ activeEdit }: AddEditCalendarProps): JSX.Element => {
  const dispatch = useDispatch();
  const [editCalendar, setEditCalendar] = useState(false);
  const [openAddCalendar, setOpenAddCalendar] = useState(false);
  const [selectedCalendarName, setSelectedCalendarName] = useState<string | undefined>();

  useEffect(() => {
    dispatch(fetchCalendars());
    dispatch(fetchEventStreams());
  }, [dispatch]);

  const { calendars } = useSelector((state: RootState) => state.calendarService);
  const { fetchCalendarState } = useSelector((state: RootState) => ({
    fetchCalendarState: state.calendarService.indicator?.details[FETCH_CALENDARS_ACTION] || '',
  }));

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenAddCalendar(true);
    }
  }, [activeEdit]);

  // eslint-disable-next-line

  const reset = () => {
    setEditCalendar(false);
    setOpenAddCalendar(false);
  };

  const onEdit = (calendar) => {
    setSelectedCalendarName(calendar.name);
    setEditCalendar(true);
  };

  return (
    <>
      <div>
        <GoAButton
          testId="add-calendar-btn"
          onClick={() => {
            setSelectedCalendarName(undefined);
            setEditCalendar(true);
          }}
        >
          Add calendar
        </GoAButton>
      </div>
      {fetchCalendarState === ActionState.inProcess && <PageIndicator />}
      {fetchCalendarState === ActionState.completed && !calendars && renderNoItem('calendar')}
      {fetchCalendarState === ActionState.completed && calendars && (
        <div>
          <CalendarTableComponent calendars={calendars} onEdit={onEdit} />
        </div>
      )}

      <CalendarModal
        open={editCalendar || openAddCalendar}
        calendarName={selectedCalendarName}
        onCancel={() => {
          reset();
        }}
        onSave={(calendar) => dispatch(UpdateCalendar(calendar))}
      />
    </>
  );
};
