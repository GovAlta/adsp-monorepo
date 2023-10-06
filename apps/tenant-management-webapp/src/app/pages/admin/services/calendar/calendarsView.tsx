import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { fetchCalendars, UpdateCalendar, FETCH_CALENDARS_ACTION } from '@store/calendar/actions';
import { CalendarItem, defaultCalendar } from '@store/calendar/models';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAButton } from '@abgov/react-components-new';
import { FetchRealmRoles } from '@store/tenant/actions';
import { fetchKeycloakServiceRoles } from '@store/access/actions';
import { CalendarModal } from './calendarModal';
import { CalendarTableComponent } from './calendarList';
import { fetchEventStreams } from '@store/stream/actions';
import { tenantRolesAndClients } from '@store/sharedSelectors/roles';
import { ActionState } from '@store/session/models';

interface AddEditCalendarProps {
  activeEdit: boolean;
}
export const CalendarsView = ({ activeEdit }: AddEditCalendarProps): JSX.Element => {
  const dispatch = useDispatch();
  const [modalType, setModalType] = useState('');
  const [editCalendar, setEditCalendar] = useState(false);
  const [openAddCalendar, setOpenAddCalendar] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<CalendarItem>(defaultCalendar);

  useEffect(() => {
    dispatch(fetchCalendars());
    dispatch(FetchRealmRoles());
    dispatch(fetchKeycloakServiceRoles());
    dispatch(fetchEventStreams());
  }, []);
  const tenant = useSelector(tenantRolesAndClients);

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
    setSelectedCalendar(defaultCalendar);
    setOpenAddCalendar(false);
  };

  const onEdit = (calendar) => {
    setSelectedCalendar(calendar);
    setModalType('edit');
    setEditCalendar(true);
  };

  return (
    <>
      <div>
        <GoAButton
          testId="add-calendar-btn"
          onClick={() => {
            setSelectedCalendar(defaultCalendar);
            setModalType('new');
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
        initialValue={selectedCalendar}
        type={openAddCalendar ? 'new' : modalType}
        realmRoles={tenant.realmRoles}
        tenantClients={tenant.tenantClients ? tenant.tenantClients : {}}
        onCancel={() => {
          reset();
        }}
        onSave={(calendar) => dispatch(UpdateCalendar(calendar))}
      />
    </>
  );
};
