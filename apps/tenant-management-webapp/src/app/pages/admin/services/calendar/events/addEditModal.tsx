import React, { useEffect, useState } from 'react';
import {
  GoAModal,
  GoAFormItem,
  GoAButton,
  GoAButtonGroup,
  GoAInput,
  GoATextArea,
  GoACheckbox,
  GoAInputDate,
  GoAInputTime,
  GoAGrid,
} from '@abgov/react-components-new';
import { selectAddModalEvent, selectSelectedCalendarEventNames } from '@store/calendar/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, duplicateNameCheck, badCharsCheck } from '@lib/validation/checkInput';
import { ResetModalState } from '@store/session/actions';
import { CalendarEvent } from '@store/calendar/models';
import { CreateEventsByCalendar, UpdateEventsByCalendar } from '@store/calendar/actions';
import { areObjectsEqual } from '@lib/objectUtil';

interface EventAddEditModalProps {
  calendarName: string;
}
export const EventAddEditModal = ({ calendarName }: EventAddEditModalProps): JSX.Element => {
  const initCalendarEvent = useSelector((state) => selectAddModalEvent(state, calendarName));

  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent>(initCalendarEvent);
  const calendarEvents = useSelector((state) => selectSelectedCalendarEventNames(state, calendarName));
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  //eslint-disable-next-line
  const [isEndBeforeStart, setIsEndBeforeStart] = useState(false);
  const isEdit = !!initCalendarEvent?.id;

  if (isEdit) {
    const indexToRemove: number = calendarEvents?.indexOf(calendarEvent?.name);

    if (indexToRemove !== -1) {
      calendarEvents?.splice(indexToRemove, 1);
    }
  }
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', badCharsCheck, duplicateNameCheck(calendarEvents, 'Calendar Events'))
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .add('start', 'start', isNotEmptyCheck('start'))
    .add('end', 'end', isNotEmptyCheck('end'))
    .build();
  const getTimeString = (calendarDateString: string) => {
    const timeString = calendarDateString?.split('T')[1];
    return timeString ? timeString.substring(0, 8) : '';
  };
  const setTimeString = (dateString, timeString) => {
    const dateDate = new Date(dateString);
    if (timeString) {
      dateDate.setHours(timeString?.split(':')[0]);
      dateDate.setMinutes(timeString?.split(':')[1]);
      dateDate.setSeconds(timeString?.split(':')[2]);
    }
    return dateDate.toISOString();
  };

  const modalTitle = `${isEdit ? 'Edit' : 'Add'} calendar event`;
  useEffect(() => {
    setCalendarEvent(initCalendarEvent);

    if (initCalendarEvent?.start) {
      setStartTime(getTimeString(initCalendarEvent?.start));
      setEndTime(getTimeString(initCalendarEvent?.end));
      setStartDate(initCalendarEvent?.start);
      setEndDate(initCalendarEvent?.end);
    }
  }, [initCalendarEvent]);

  const dispatch = useDispatch();
  if (initCalendarEvent === null) return <></>;
  return (
    <GoAModal
      open={initCalendarEvent !== null}
      heading={modalTitle}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="calendar-event-modal-cancel"
            onClick={() => {
              validators.clear();
              setCalendarEvent(initCalendarEvent);
              dispatch(ResetModalState());
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="calendar-event-modal-save"
            disabled={validators.haveErrors() || areObjectsEqual(calendarEvent, initCalendarEvent)}
            onClick={() => {
              if (new Date(calendarEvent.start) > new Date(calendarEvent.end)) {
                setIsEndBeforeStart(true);
                errors['end'] = 'End of event must be after start of event.';
                return;
              }
              const validations = {
                name: calendarEvent.name,
                end: calendarEvent.end,
              };
              validations['duplicated'] = calendarEvent.name;
              if (!validators?.checkAll(validations)) {
                return;
              }

              if (calendarEvent.isAllDay) {
                const theDayStart = new Date(calendarEvent.start).setHours(0, 0, 0, 0);
                const theDayEnd = new Date(calendarEvent.end).setHours(23, 59, 59, 999);
                calendarEvent.start = new Date(theDayStart).toISOString();
                calendarEvent.end = new Date(theDayEnd).toISOString();
              }

              if (isEdit) {
                dispatch(UpdateEventsByCalendar(calendarName, calendarEvent?.id.toString(), calendarEvent));
              } else {
                dispatch(CreateEventsByCalendar(calendarName, calendarEvent));
              }
              dispatch(ResetModalState());
              validators.clear();
              setIsEndBeforeStart(false);
              setCalendarEvent(initCalendarEvent);
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem error={errors?.['name']} label="Name">
        <GoAInput
          type="text"
          name="eventName"
          value={calendarEvent?.name}
          testId={`calendar-event-modal-name-input`}
          aria-label="eventName"
          width="100%"
          onChange={(_, value) => {
            validators.remove('name');
            validators['name'].check(value);
            setCalendarEvent({ ...calendarEvent, name: value });
          }}
        />
      </GoAFormItem>
      <GoAFormItem error={errors?.['description']} label="Description" mb={'xl'}>
        <GoATextArea
          name="description"
          value={calendarEvent?.description}
          testId={`calendar-event-modal-description-input`}
          aria-label="description"
          width="100%"
          // eslint-disable-next-line
          onChange={() => {}}
          onKeyPress={(name, value) => {
            validators.remove('description');
            validators['description'].check(value);
            setCalendarEvent({ ...calendarEvent, description: value });
          }}
        />
      </GoAFormItem>

      <GoACheckbox
        name="isPublicCheckbox"
        checked={calendarEvent?.isPublic}
        text={'Is public '}
        onChange={(name, value) => {
          setCalendarEvent({ ...calendarEvent, isPublic: value });
        }}
      />

      <GoACheckbox
        name="isAllDayCheckbox"
        checked={calendarEvent?.isAllDay}
        text={'Is all day'}
        onChange={(name, value) => {
          setCalendarEvent({ ...calendarEvent, isAllDay: value });
        }}
      />

      <GoAGrid minChildWidth="25ch" gap="s">
        <GoAFormItem label="Start Date" error={errors?.['start']}>
          <GoAInputDate
            name="StartDate"
            value={calendarEvent?.start ? new Date(calendarEvent.start) : new Date()}
            width="100%"
            testId="calendar-event-modal-start-date-input"
            onChange={(name, value) => {
              validators.remove('start');
              validators['start'].check(value.toString());
              setStartDate(value.toLocaleString());
              setCalendarEvent({ ...calendarEvent, start: setTimeString(value.toLocaleString(), startTime) });
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Start Time">
          <GoAInputTime
            name="StartTime"
            value={startTime}
            step={1}
            width="100%"
            testId="calendar-event-modal-start-time-input"
            disabled={calendarEvent?.isAllDay}
            onChange={(name, value) => {
              setCalendarEvent({ ...calendarEvent, start: setTimeString(startDate, value) });
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="End Date" error={errors?.['end']}>
          <GoAInputDate
            name="endDate"
            value={calendarEvent?.end ? new Date(calendarEvent?.end) : new Date()}
            width="100%"
            testId="calendar-event-modal-end-date-input"
            onChange={(name, value) => {
              validators.remove('end');
              validators['end'].check(value.toString());
              setEndDate(value.toLocaleString());
              setCalendarEvent({ ...calendarEvent, end: setTimeString(value.toLocaleString(), endTime) });
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="End time">
          <GoAInputTime
            name="endTime"
            value={endTime}
            step={1}
            width="100%"
            disabled={calendarEvent?.isAllDay}
            testId="calendar-event-modal-end-time-input"
            onChange={(name, value) => {
              setCalendarEvent({ ...calendarEvent, end: setTimeString(endDate, value) });
            }}
          />
        </GoAFormItem>
      </GoAGrid>
    </GoAModal>
  );
};
