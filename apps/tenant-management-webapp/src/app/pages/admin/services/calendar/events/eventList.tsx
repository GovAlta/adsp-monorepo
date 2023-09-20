import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectSelectedCalendarEvents } from '@store/calendar/selectors';
import { CalendarEvent, EventAddEditModalType, EventDeleteModalType } from '@store/calendar/models';
import { GoATable } from '@abgov/react-components-new';
import { renderNoItem } from '@components/NoItem';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { UpdateModalState } from '@store/session/actions';
import moment from 'moment';
import { RootState } from '@store/index';

import { DeleteModal } from './deleteModal';

interface EventListRowProps {
  event: CalendarEvent;
  calendarName: string;
}

const eventDateFormat = (dateString: string) => {
  const date = new Date(dateString);
  return moment(date).format('DD-MMM-YY ddd HH:mm');
};

const dateTitleSpanStyle = {
  width: '2.5rem',
  display: 'inline-block',
};

const EventListRow = ({ event, calendarName }: EventListRowProps): JSX.Element => {
  const dispatch = useDispatch();
  return (
    <tr>
      <td>
        <div>
          <span style={dateTitleSpanStyle}>From</span>: {eventDateFormat(event.start)}
        </div>
        <div>
          <span style={dateTitleSpanStyle}>to</span>: {eventDateFormat(event.end)}
        </div>
      </td>
      <td>{event.description}</td>
      <td headers="calendar-events-actions" data-testid="calendar-selected-events-actions">
        {
          <div style={{ display: 'flex' }}>
            <GoAContextMenuIcon
              testId="add-attendance-icon"
              title="add-attendance"
              type="person-circle"
              // eslint-disable-next-line
              onClick={() => {}}
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
      <DeleteModal calendarName={calendarName} />
      <GoATable testId="calendar-selected-event-table">
        <thead>
          <tr>
            <th>Event time</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {selectedEvents.map((event) => {
            return <EventListRow event={event} calendarName={calendarName} key={`calendar-event-row-${event.id}`} />;
          })}
        </tbody>
      </GoATable>
    </>
  );
};
