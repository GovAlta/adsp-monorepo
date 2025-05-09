import React, { FunctionComponent, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { GoAButton, GoAFormItem, GoAInputDate, GoAInputTime } from '@abgov/react-components';
import { UpdateEventsByCalendar } from '@store/calendar/actions';

import { CalendarEvent } from '@store/calendar/models';
import { calendarFormat } from 'moment';

export interface startEndProps {
  event: CalendarEvent;
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

export const StartEndDateEditor: FunctionComponent<startEndProps> = ({ event }) => {
  const [edit, setEdit] = useState<boolean>(false);
  const dispatch = useDispatch();

  console.log(JSON.stringify(event));

  const [startTime, setStartTime] = useState<string>(event.start);
  const [endTime, setEndTime] = useState<string>(new Date(event.start)?.toTimeString().split(' ')[0]);
  const [startDate, setStartDate] = useState<string>(event.end);
  const [endDate, setEndDate] = useState<string>(new Date(event.end)?.toTimeString().split(' ')[0]);

  return (
    <>
      <GoAButton type="secondary" onClick={() => setEdit(true)}>
        Edit
      </GoAButton>
      <GoAButton type="secondary" onClick={() => setEdit(false)}>
        Cancel
      </GoAButton>
      <GoAButton
        type="secondary"
        onClick={() => {
          setEdit(false);
          console.log(JSON.stringify(setTimeString(startDate, startTime)) + '< setTimeString(startDate, startTime)');
          console.log(JSON.stringify(setTimeString(endDate, endTime)) + '< setTimeString(endDate, endTime)');
          event.start = setTimeString(startDate, startTime);
          event.end = setTimeString(endDate, endTime);

          dispatch(UpdateEventsByCalendar(event.name, event?.id.toString(), event));
        }}
      >
        Save
      </GoAButton>

      <GoAInputDate
        name="startDate"
        value={event.start ? new Date(event.start) : new Date()}
        width="100%"
        testId="calendar-event-modal-start-date-input"
        disabled={!edit}
        onChange={(name, value) => {
          setStartDate(value.toLocaleString());
        }}
      />

      <GoAFormItem label="Start time">
        <GoAInputTime
          name="StartTime"
          value={new Date(event.start)?.toTimeString().split(' ')[0]}
          step={1}
          width="100%"
          testId="calendar-event-modal-start-time-input"
          disabled={!edit}
          onChange={(name, value) => {
            setStartTime(value);
          }}
        />
      </GoAFormItem>

      <GoAFormItem label="End date">
        <GoAInputDate
          name="endDate"
          value={event.end ? new Date(event.end) : new Date()}
          width="100%"
          testId="calendar-event-modal-end-date-input"
          disabled={!edit}
          onChange={(name, value) => {
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
          onChange={(name, value) => {
            setEndTime(value);
          }}
        />
      </GoAFormItem>
    </>
  );
};
