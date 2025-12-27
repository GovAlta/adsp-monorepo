import React, { FunctionComponent, useState } from 'react';
import { useDispatch } from 'react-redux';
import { GoabButton, GoabFormItem, GoabInput, GoabButtonGroup, GoabGrid } from '@abgov/react-components';
import { UpdateEventByCalendar, CreateEventByCalendar } from '../../../state';
import styles from './Editor.module.scss';
import { CalendarEvent } from '../../../state';
import { AppDispatch } from '../../../state';


import { DeleteCalendarEvent } from '../../../state';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';

export const getDateTime = (date, time) => {
  const newDate = new Date(date);
  const combinedDateTime = new Date(
    newDate.getMonth() + 1 + '/' + newDate.getDate() + '/' + newDate.getFullYear() + ' ' + time
  );
  return combinedDateTime;
};


export interface startEndProps {
  event: CalendarEvent;
  formId?: string;
  closeIntake: () => void;
  newEvent: boolean;
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

export const StartEndDateEditor: FunctionComponent<startEndProps> = ({ event, formId, closeIntake, newEvent }) => {
  const [edit, setEdit] = useState<boolean>(newEvent);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  const dispatch = useDispatch<AppDispatch>();

  const [startTime, setStartTime] = useState<string>(new Date(event.start)?.toTimeString().split(' ')[0]);
  const [endTime, setEndTime] = useState<string>(new Date(event.end)?.toTimeString().split(' ')[0]);
  const [startDate, setStartDate] = useState<string>(event.start);
  const [endDate, setEndDate] = useState<string>(event.end);
  const [endDateError, setEndDateError] = useState<string>('');

  return (
    <>
      <GoabGrid minChildWidth="25ch" gap="s">
        <GoabFormItem label="Start date">
          <GoabInput
            type="date"
            name=""
            value={(event.start ? new Date(event.start) : new Date()).toISOString().slice(0, 10)}
            width="100%"
            testId="calendar-event-modal-start-date-input"
            disabled={!edit}
            onChange={(detail: GoabInputOnChangeDetail) => {
              setStartDate(detail.value.toLocaleString());
            }}
          />
        </GoabFormItem>
        <GoabFormItem label="Start time">
          <GoabInput
            type="time"
            name="StartTime"
            value={new Date(event.start)?.toTimeString().split(' ')[0]}
            step={1}
            width="100%"
            testId="calendar-event-modal-start-time-input"
            disabled={!edit}
            onChange={(detail: GoabInputOnChangeDetail) => {
              setStartTime(detail.value);
            }}
          />
        </GoabFormItem>
        <GoabFormItem label="End date" error={endDateError}>
          <GoabInput
            type="date"
            name="endDate"
            value={(event.end ? new Date(event.end) : new Date()).toISOString().slice(0, 10)}
            width="100%"
            testId="calendar-event-modal-end-date-input"
            disabled={!edit}
            onChange={(detail: GoabInputOnChangeDetail) => {
              setEndDate(detail.value.toLocaleString());
            }}
          />
        </GoabFormItem>
        <GoabFormItem label="End time">
          <GoabInput
            type="time"
            name="endTime"
            value={new Date(event.end)?.toTimeString().split(' ')[0]}
            step={1}
            width="100%"
            testId="calendar-event-modal-end-time-input"
            disabled={!edit}
            onChange={(detail: GoabInputOnChangeDetail) => {
              setEndTime(detail.value);
            }}
          />
        </GoabFormItem>
      </GoabGrid>
      {!edit && (
        <GoabButtonGroup alignment="start">
          {!deleteConfirm && (
            <>
              <div className={styles['Margin']}>
                <GoabButton type="secondary" onClick={() => setEdit(true)}>
                  Edit
                </GoabButton>
              </div>
              <div className={styles['Margin']}>
                <GoabButton
                  type="primary"
                  variant="destructive"
                  testId="delete-confirm"
                  onClick={() => setDeleteConfirm(true)}
                >
                  Delete
                </GoabButton>
              </div>
            </>
          )}
          {deleteConfirm && (
            <>
              <div className={styles['Margin']}>
                <GoabButton type="secondary" testId="delete-cancel" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </GoabButton>
              </div>
              <div className={styles['Margin']}>
                <GoabButton
                  type="primary"
                  variant="destructive"
                  testId="delete-confirm"
                  onClick={() => {
                    setDeleteConfirm(false);

                    dispatch(
                      DeleteCalendarEvent({
                        eventId: `${event?.id}`,
                      })
                    );
                  }}
                >
                  Confirm Delete
                </GoabButton>
              </div>
            </>
          )}
        </GoabButtonGroup>
      )}
      {edit && (
        <div className={styles['Margin']}>
          <GoabButtonGroup alignment="end">
            <GoabButton
              type="secondary"
              onClick={() => {
                setEdit(false);
                closeIntake();
              }}
            >
              Cancel
            </GoabButton>

            <GoabButton
              type="primary"
              onClick={() => {
                if (getDateTime(endDate, endTime) < getDateTime(startDate, startTime)) {
                  setEndDateError('End of event must be after start of event.');
                } else {
                  setEndDateError('');
                  setEdit(false);

                  const TempEvent: CalendarEvent = { ...event };

                  TempEvent.start = setTimeString(startDate, startTime);
                  TempEvent.end = setTimeString(endDate, endTime);
                  TempEvent.recordId = formId;

                  if (TempEvent?.id) {
                    dispatch(
                      UpdateEventByCalendar({
                        calendarName: 'form-intake',
                        eventId: TempEvent?.id.toString(),
                        payload: TempEvent,
                      })
                    );
                  } else {
                    TempEvent.name = `${formId}-${String(Math.floor(Date.now() / 1000))}`;
                    dispatch(CreateEventByCalendar({ payload: TempEvent }));
                  }
                  closeIntake();
                }
              }}
            >
              Save
            </GoabButton>
          </GoabButtonGroup>
        </div>
      )}
    </>
  );
};
