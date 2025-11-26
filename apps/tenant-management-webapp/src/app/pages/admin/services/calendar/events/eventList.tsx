import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedCalendarEvents, selectSelectedCalendarNextEvents } from '@store/calendar/selectors';
import { CalendarEvent, EventAddEditModalType, EventDeleteModalType } from '@store/calendar/models';
import { GoABadge, GoAButton, GoASkeleton, GoACircularProgress } from '@abgov/react-components';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { UpdateModalState } from '@store/session/actions';
import { RootState } from '@store/index';
import {
  EventDetailRow,
  EventDetailTd,
  EventDetailDescription,
  EventDetailDate,
  CalendarEventRow,
  EventDetailGap,
  EventDetailsActionsWrapper,
  CalendarNameText,
} from './styled-components';
import { DeleteModal } from './deleteModal';
import DataTable from '@components/DataTable';
import { ProgressWrapper, CalendarEventListWrapper, EventListNameTd, EventTableHeader } from './styled-components';
import { LoadMoreWrapper } from '@components/styled-components';
import { FetchEventsByCalendar } from '@store/calendar/actions';

interface EventListRowProps {
  event: CalendarEvent;
  calendarName: string;
}

interface EventDetailsProps {
  event: CalendarEvent;
}

interface LoadMoreEventsProps {
  next: string;
  calendarName: string;
}

const eventDateFormat = (dateString: string, isAllDay: boolean) => {
  const date = new Date(dateString);
  const time = date.toLocaleString('en-us', { hour: '2-digit', minute: '2-digit' });
  if (isAllDay) {
    return `${getDateString(date)}`;
  } else {
    return `${getDateString(date)}, ${time}`;
  }
};

const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const EventDetailTime = (start: string, end: string, isAllDay: boolean): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startWeekDay = startDate.toLocaleString('en-us', { weekday: 'long' });
  const endWeekDay = endDate.toLocaleString('en-us', { weekday: 'long' });
  const startDateDateString = getDateString(startDate);
  const stateDateTimeString = startDate.toLocaleString('en-us', { hour: '2-digit', minute: '2-digit' });
  const endDateDateString = getDateString(endDate);
  const endDateTimeString = startDate.toLocaleString('en-us', { hour: '2-digit', minute: '2-digit' });
  if (startDate.getDate() === endDate.getDate()) {
    if (isAllDay) {
      return `${startWeekDay}, ${startDateDateString}`;
    } else {
      return `${startWeekDay}, ${startDateDateString}, ${stateDateTimeString} - ${endDateTimeString}`;
    }
  } else {
    if (isAllDay) {
      return `${startWeekDay}, ${startDateDateString} - ${endWeekDay}, ${endDateDateString}`;
    } else {
      return `${startWeekDay}, ${startDateDateString}, ${stateDateTimeString} - ${endWeekDay}, ${endDateDateString}, ${endDateTimeString}`;
    }
  }
};

const LoadMoreEvents = ({ next, calendarName }: LoadMoreEventsProps): JSX.Element => {
  const dispatch = useDispatch();
  const { indicator } = useSelector((state: RootState) => ({
    indicator: state.session?.elementIndicator,
  }));

  //eslint-disable-next-line
  useEffect(() => {}, [indicator]);

  if (indicator?.show) {
    return <GoASkeleton type="text" key={1} />;
  }

  return next ? (
    <LoadMoreWrapper>
      <GoAButton
        testId="calendar-event-load-more-btn"
        key="calendar-event-load-more-btn"
        type="tertiary"
        onClick={() => {
          dispatch(FetchEventsByCalendar(calendarName, next));
        }}
      >
        Load more
      </GoAButton>
    </LoadMoreWrapper>
  ) : null;
};

const EventDetails = ({ event }: EventDetailsProps): JSX.Element => {
  return (
    <EventDetailTd colSpan={4}>
      <h3>{event.name}</h3>
      <EventDetailDate>{EventDetailTime(event.start, event.end, event?.isAllDay)}</EventDetailDate>
      <EventDetailDescription>
        {event.description?.length === 0 ? <b>No description</b> : event.description}
      </EventDetailDescription>

      {(event?.isAllDay === true || event?.isPublic === true) && <EventDetailGap />}

      {event?.isAllDay === true && (
        <div>
          <GoABadge type="midtone" content="All day" icon={false} />
        </div>
      )}

      {event?.isAllDay === true && event?.isPublic === true && <EventDetailGap />}

      {event?.isPublic === true && (
        <div>
          <GoABadge type="midtone" content=" Public " icon={false} />
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
        <td>
          <CalendarNameText>{event?.name}</CalendarNameText>
        </td>
        <EventListNameTd>{eventDateFormat(event.start, event?.isAllDay)}</EventListNameTd>
        <td>{eventDateFormat(event.end, event?.isAllDay)}</td>
        <td headers="calendar-events-actions" data-testid="calendar-selected-events-actions">
          {
            <EventDetailsActionsWrapper>
              <GoAContextMenuIcon
                type={showDetails ? 'eye-off' : 'eye'}
                title="Toggle details"
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
  const next = useSelector((state: RootState) => selectSelectedCalendarNextEvents(state, calendarName));
  // eslint-disable-next-line
  useEffect(() => {}, [selectedEvents]);

  if (!selectedEvents) {
    return (
      <ProgressWrapper>
        <GoACircularProgress visible={true} size="small" />
      </ProgressWrapper>
    );
  }

  if (!selectedEvents || selectedEvents.length === 0) {
    return (
      <div>
        <br />
        <b> There are no events available between the selected dates in this calendar</b>
      </div>
    );
  }

  return (
    <>
      <CalendarEventListWrapper>
        <DeleteModal calendarName={calendarName} />
        <DataTable testId="calendar-selected-event-table">
          <thead>
            <tr>
              <th data-testid="event-name-th">Event name</th>
              <th data-testid="start-date-and-time-th">Start date and time</th>
              <th data-testid="end-date-and-time-th">End date and time</th>
              <th data-testid="action-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedEvents.map((event) => {
              return <EventListRow event={event} calendarName={calendarName} key={`calendar-event-row-${event.id}`} />;
            })}
          </tbody>
        </DataTable>
      </CalendarEventListWrapper>
      {!next && <LoadMoreWrapper />}
      <LoadMoreEvents next={next} calendarName={calendarName} />
    </>
  );
};
