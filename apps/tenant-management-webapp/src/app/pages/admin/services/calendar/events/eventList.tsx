import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedCalendarEvents } from '@store/calendar/selectors';
import { CalendarEvent, EventAddEditModalType, EventDeleteModalType } from '@store/calendar/models';
import { GoACheckbox } from '@abgov/react-components-new';
import { renderNoItem } from '@components/NoItem';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { UpdateModalState } from '@store/session/actions';
import moment from 'moment';
import { RootState } from '@store/index';
import {
  TitleSpace,
  EventDetailRow,
  EventDetailTd,
  EventDetailName,
  EventDetailDescription,
  EventDetailDate,
} from './styled-components';
import { DeleteModal } from './deleteModal';
import DataTable from '@components/DataTable';

interface EventListRowProps {
  event: CalendarEvent;
  calendarName: string;
}

interface EventDetailsProps {
  event: CalendarEvent;
}

const eventDateFormat = (dateString: string) => {
  const date = new Date(dateString);
  return moment(date).format('DD-MMM-YY ddd HH:mm');
};

const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EventDetailTime = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startWeekDay = startDate.toLocaleString('en-us', { weekday: 'long' });
  const startDateDateString = getDateString(startDate);
  const stateDateTimeString = startDate.toLocaleString('en-us', { hour: '2-digit', minute: '2-digit' });
  const endDateDateString = getDateString(endDate);
  const endDateTimeString = startDate.toLocaleString('en-us', { hour: '2-digit', minute: '2-digit' });
  if (startDate.getDate() === endDate.getDate()) {
    return `${startWeekDay}, ${startDateDateString}, ${stateDateTimeString} - ${endDateTimeString}`;
  } else {
    return `${startWeekDay}, ${startDateDateString} - ${endDateDateString}, ${stateDateTimeString} - ${endDateTimeString}`;
  }
};

const EventDetails = ({ event }: EventDetailsProps): JSX.Element => {
  return (
    <EventDetailTd colSpan={4}>
      <EventDetailName>{event.name}</EventDetailName>
      <EventDetailDate>{EventDetailTime(event.start, event.end)}</EventDetailDate>
      <EventDetailDescription>{event.description}</EventDetailDescription>
      <GoACheckbox name="event-detail-is-all-day" checked={event?.isAllDay} text={'All day '} disabled={true} />
      <GoACheckbox name="event-detail-is-public" checked={event?.isPublic} text={'Public '} disabled={true} />
    </EventDetailTd>
  );
};

const EventListRow = ({ event, calendarName }: EventListRowProps): JSX.Element => {
  const dispatch = useDispatch();
  const [showDetails, setShowDetails] = useState(false);
  return (
    <>
      <tr>
        <td>{event?.name}</td>
        <td>{eventDateFormat(event.start)}</td>
        <td>{eventDateFormat(event.end)}</td>
        <td headers="calendar-events-actions" data-testid="calendar-selected-events-actions">
          {
            <div style={{ display: 'flex' }}>
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                onClick={() => setShowDetails(!showDetails)}
                testId="directory-toggle-details-visibility"
              />

              <GoAContextMenuIcon
                type="create"
                title="Edit"
                testId={`calendar-event-${event.id}`}
                onClick={() => {
                  dispatch(
                    UpdateModalState({
                      type: EventAddEditModalType,
                      id: `${event.id}`,
                      isOpen: true,
                    })
                  );
                }}
              />
              <GoAContextMenuIcon
                testId="delete-icon"
                title="Delete"
                type="trash"
                onClick={() => {
                  dispatch(
                    UpdateModalState({
                      type: EventDeleteModalType,
                      id: `${event.id}`,
                      isOpen: true,
                    })
                  );
                }}
              />
            </div>
          }
        </td>
      </tr>
      {showDetails && (
        <EventDetailRow>
          <EventDetails event={event} />
        </EventDetailRow>
      )}
    </>
  );
};

interface EventListProps {
  calendarName: string;
}
export const EventList = ({ calendarName }: EventListProps): JSX.Element => {
  const selectedEvents = useSelector((state: RootState) => selectSelectedCalendarEvents(state, calendarName));

  // eslint-disable-next-line
  useEffect(() => {}, [selectedEvents]);

  if (!selectedEvents || selectedEvents.length === 0) {
    return <>{renderNoItem('Calendar events')}</>;
  }

  return (
    <>
      <TitleSpace />
      <h2>Event list</h2>
      <DeleteModal calendarName={calendarName} />
      <DataTable testId="calendar-selected-event-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Start time</th>
            <th>End time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {selectedEvents.map((event) => {
            return <EventListRow event={event} calendarName={calendarName} key={`calendar-event-row-${event.id}`} />;
          })}
        </tbody>
      </DataTable>
    </>
  );
};
