import React, { FunctionComponent, useState } from 'react';
import { GoAButton, GoAFormItem, GoAInputDate, GoAInputTime, GoAButtonGroup, GoAGrid } from '@abgov/react-components';
import { getDateTime } from '../components/timeUtil';
import { Margin } from '../styled-components';

export interface Attendee {
  id: number;
  name: string;
  email: string;
}
export interface CalendarEvent {
  id?: number;
  name: string;
  description?: string | null;
  start: string;
  end: string;
  isPublic: boolean;
  isAllDay?: boolean;
  attendees?: Attendee[];
  recordId?: string;
}

export interface startEndProps {
  event: CalendarEvent;
  formId?: string;
  closeIntake?: () => void;
  newEvent: boolean;
  DeleteCalendarEvent: (eventId: string) => void;
  UpdateEventsByCalendar: (eventId: string, event: CalendarEvent) => void;
  CreateEventsByCalendar: (event: CalendarEvent) => void;
}

const setTimeString = (dateString, timeString?) => {
  const dateDate = new Date(dateString);
  if (timeString) {
    dateDate.setHours(timeString?.split(':')[0]);
    dateDate.setMinutes(timeString?.split(':')[1]);
    dateDate.setSeconds(timeString?.split(':')[2]);
  }
  return dateDate.toISOString();
};

export const StartEndDateEditor: FunctionComponent<startEndProps> = ({
  event,
  formId,
  closeIntake,
  newEvent,
  DeleteCalendarEvent,
  UpdateEventsByCalendar, 
  CreateEventsByCalendar
}) => {
  const [edit, setEdit] = useState<boolean>(newEvent);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);

  const [startTime, setStartTime] = useState<string>(new Date(event.start)?.toTimeString().split(' ')[0]);
  const [endTime, setEndTime] = useState<string>(new Date(event.end)?.toTimeString().split(' ')[0]);
  const [startDate, setStartDate] = useState<string>(event.start);
  const [endDate, setEndDate] = useState<string>(event.end);
  const [endDateError, setEndDateError] = useState<string>('');

  return (
    <>
      <GoAGrid minChildWidth="25ch" gap="s">
        <GoAFormItem label="Start date">
          <GoAInputDate
            name=""
            value={event.start ? new Date(event.start) : new Date()}
            width="100%"
            testId="calendar-event-modal-start-date-input"
            disabled={!edit}
            onChange={(_, value) => {
              setStartDate(value.toLocaleString());
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Start time">
          <GoAInputTime
            name="StartTime"
            value={new Date(event.start)?.toTimeString().split(' ')[0]}
            step={1}
            width="100%"
            testId="calendar-event-modal-start-time-input"
            disabled={!edit}
            onChange={(_, value) => {
              setStartTime(value);
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="End date" error={endDateError}>
          <GoAInputDate
            name="endDate"
            value={event.end ? new Date(event.end) : new Date()}
            width="100%"
            testId="calendar-event-modal-end-date-input"
            disabled={!edit}
            onChange={(_, value) => {
              setEndDate(value.toLocaleString());
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="End time">
          <GoAInputTime
            name="endTime"
            value={new Date(event.end)?.toTimeString().split(' ')[0]}
            step={1}
            width="100%"
            testId="calendar-event-modal-end-time-input"
            disabled={!edit}
            onChange={(_, value) => {
              setEndTime(value);
            }}
          />
        </GoAFormItem>
      </GoAGrid>
      {!edit && (
        <GoAButtonGroup alignment="start">
          {!deleteConfirm && (
            <>
              <Margin>
                <GoAButton type="secondary" onClick={() => setEdit(true)}>
                  Edit
                </GoAButton>
              </Margin>
              <Margin>
                <GoAButton
                  type="primary"
                  variant="destructive"
                  testId="delete-confirm"
                  onClick={() => setDeleteConfirm(true)}
                >
                  Delete
                </GoAButton>
              </Margin>
            </>
          )}
          {deleteConfirm && (
            <>
              <Margin>
                <GoAButton type="secondary" testId="delete-cancel" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </GoAButton>
              </Margin>
              <Margin>
                <GoAButton
                  type="primary"
                  variant="destructive"
                  testId="delete-confirm"
                  onClick={() => {
                    setDeleteConfirm(false);
                    DeleteCalendarEvent(`${event?.id}`);
                  }}
                >
                  Confirm Delete
                </GoAButton>
              </Margin>
            </>
          )}
        </GoAButtonGroup>
      )}
      {edit && (
        <Margin>
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              onClick={() => {
                setEdit(false);
                closeIntake();
              }}
            >
              Cancel
            </GoAButton>

            <GoAButton
              type="primary"
              onClick={() => {
                if (getDateTime(endDate, endTime) < getDateTime(startDate, startTime)) {
                  setEndDateError('End of event must be after start of event.');
                } else {
                  setEndDateError('');
                  setEdit(false);

                  event.start = setTimeString(startDate, startTime);
                  event.end = setTimeString(endDate, endTime);
                  event.recordId = formId;

                  if (event?.id) {
                    UpdateEventsByCalendar(event?.id.toString(), event);
                  } else {
                    event.name = `${formId}-${String(Math.floor(Date.now() / 1000))}`;
                    CreateEventsByCalendar(event);
                  }
                  closeIntake();
                }
              }}
            >
              Save
            </GoAButton>
          </GoAButtonGroup>
        </Margin>
      )}
    </>
  );
};
