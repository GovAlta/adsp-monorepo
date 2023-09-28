import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedCalendarEvents } from '@store/calendar/selectors';
import { CalendarEvent, EventAddEditModalType, EventDeleteModalType } from '@store/calendar/models';
import { GoABadge } from '@abgov/react-components-new';
import { renderNoItem } from '@components/NoItem';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { UpdateModalState } from '@store/session/actions';
import { RootState } from '@store/index';
import {
  TitleSpace,
  EventDetailRow,
  EventDetailTd,
  EventDetailName,
  EventDetailDescription,
  EventDetailDate,
  CalendarEventRow,
  EventDetailGap,
  EventDetailsActionsWrapper,
} from './styled-components';
import { DeleteModal } from './deleteModal';
import DataTable from '@components/DataTable';
import { GoACircularProgress } from '@abgov/react-components-new';
import { ProgressWrapper, CalendarEventListWrapper, EventListNameTd } from './styled-components';

interface EventListRowProps {
  event: CalendarEvent;
  calendarName: string;
}

interface EventDetailsProps {
  event: CalendarEvent;
}

const eventDateFormat = (dateString: string) => {
  const date = new Date(dateString);
  const time = date.toLocaleString('en-us', { hour: '2-digit', minute: '2-digit' });

  return `${getDateString(date)}, ${time}`;
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
      <EventDetailDescription>
        {event.description?.length === 0 ? <b>No description</b> : event.description}
      </EventDetailDescription>

      {(event?.isAllDay === true || event?.isPublic === true) && <EventDetailGap />}

      {event?.isAllDay === true && (
        <div>
          <GoABadge type="midtone" content="All day" />
        </div>
      )}

      {event?.isAllDay === true && event?.isPublic === true && <EventDetailGap />}

      {event?.isPublic === true && (
        <div>
          <GoABadge type="midtone" content=" Public " />
        </div>
      )}
    </EventDetailTd>
  );
};

const EventListRow = ({ event }: EventListRowProps): JSX.Element => {
  const dispatch = useDispatch();
  const [showDetails, setShowDetails] = useState(false);
  return (
    <>
      <CalendarEventRow>
        <EventListNameTd>{event?.name}</EventListNameTd>
        <td>{eventDateFormat(event.start)}</td>
        <td>{eventDateFormat(event.end)}</td>
        <td headers="calendar-events-actions" data-testid="calendar-selected-events-actions">
          {
            <EventDetailsActionsWrapper>
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
            </EventDetailsActionsWrapper>
          }
        </td>
      </CalendarEventRow>
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

  if (!selectedEvents) {
    return (
      <ProgressWrapper>
        <GoACircularProgress visible={true} size="small" />
      </ProgressWrapper>
    );
  }

  if (selectedEvents && selectedEvents.length === 0) {
    return <>{renderNoItem('Calendar events')}</>;
  }

  return (
    <>
      <TitleSpace />
      <h2>Event list</h2>
      <CalendarEventListWrapper>
        <DeleteModal calendarName={calendarName} />
        <DataTable testId="calendar-selected-event-table">
          <thead>
            <tr>
              <th>Event name</th>
              <th>Start date and time</th>
              <th>End date and time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedEvents.map((event) => {
              return <EventListRow event={event} calendarName={calendarName} key={`calendar-event-row-${event.id}`} />;
            })}
          </tbody>
        </DataTable>
      </CalendarEventListWrapper>
    </>
  );
};
