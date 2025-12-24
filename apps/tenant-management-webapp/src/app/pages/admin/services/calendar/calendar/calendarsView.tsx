import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchCalendars, UpdateCalendar, FETCH_CALENDARS_ACTION } from '@store/calendar/actions';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoabButton } from '@abgov/react-components';
import { CalendarModal } from './calendarModal';
import { CalendarTableComponent } from './calendarTable';
import { fetchEventStreams } from '@store/stream/actions';
import { ActionState } from '@store/session/models';
import { DeleteConfirmationsView } from './deleteConfirmationsView';
import { FetchEventsByCalendar } from '@store/calendar/actions';
interface AddEditCalendarProps {
  activeEdit: boolean;
}
export const CalendarsView = ({ activeEdit }: AddEditCalendarProps): JSX.Element => {
  const dispatch = useDispatch();
  const [openEditCalendar, setOpenEditCalendar] = useState(false);
  const [selectedCalendarName, setSelectedCalendarName] = useState<string | undefined>();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [modalTenantMode, setModalTenantMode] = useState(true);

  useEffect(() => {
    dispatch(fetchCalendars());
    dispatch(fetchEventStreams());
  }, [dispatch]);

  const { calendars } = useSelector((state: RootState) => state.calendarService);
  const { coreCalendars } = useSelector((state: RootState) => state.calendarService);
  const { fetchCalendarState } = useSelector((state: RootState) => ({
    fetchCalendarState: state.calendarService.indicator?.details[FETCH_CALENDARS_ACTION] || '',
  }));

  useEffect(() => {
    if (activeEdit) {
      reset();
      setOpenEditCalendar(true);
    }
  }, [activeEdit]);
  // eslint-disable-next-line

  const reset = () => {
    setOpenEditCalendar(false);
    setSelectedCalendarName('');
    document.body.style.overflow = 'unset';
  };

  const onEdit = (calendar, tenantMode) => {
    setSelectedCalendarName(calendar.name);
    setModalTenantMode(tenantMode);
    setOpenEditCalendar(true);
  };

  const onDelete = (calendar) => {
    dispatch(FetchEventsByCalendar(calendar.name));
    setSelectedCalendarName(calendar.name);
    setShowDeleteConfirmation(true);
  };

  return (
    <section>
      <div>
        <GoabButton
          testId="add-calendar-btn"
          onClick={() => {
            setSelectedCalendarName(undefined);
            setOpenEditCalendar(true);
          }}
        >
          Add calendar
        </GoabButton>
      </div>
      {fetchCalendarState === ActionState.inProcess && <PageIndicator />}
      {fetchCalendarState === ActionState.completed &&
        Object.keys(calendars).length === 0 &&
        renderNoItem('tenant calendar')}
      {fetchCalendarState === ActionState.completed && Object.keys(calendars).length > 0 && (
        <div>
          <CalendarTableComponent calendars={calendars} onEdit={onEdit} onDelete={onDelete} tenantMode={true} />
        </div>
      )}
      {fetchCalendarState === ActionState.completed &&
        Object.keys(coreCalendars).length === 0 &&
        renderNoItem('core calendar')}
      {fetchCalendarState === ActionState.completed && Object.keys(coreCalendars).length > 0 && (
        <>
          <h2>Core calendars</h2>
          <div>
            <CalendarTableComponent calendars={coreCalendars} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </>
      )}

      {openEditCalendar && (
        <CalendarModal
          open={openEditCalendar}
          calendarName={selectedCalendarName}
          onCancel={() => {
            reset();
          }}
          tenantMode={modalTenantMode}
          onSave={(calendar) => dispatch(UpdateCalendar(calendar))}
        />
      )}
      {showDeleteConfirmation && (
        <DeleteConfirmationsView calendarName={selectedCalendarName}></DeleteConfirmationsView>
      )}
    </section>
  );
};
