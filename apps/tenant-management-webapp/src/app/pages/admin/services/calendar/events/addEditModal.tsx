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
} from '@abgov/react-components';
import { selectAddModalEvent, selectCoreCalendars, selectSelectedCalendarEventNames } from '@store/calendar/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, duplicateNameCheck, badCharsCheck } from '@lib/validation/checkInput';
import { ResetModalState } from '@store/session/actions';
import { CalendarEvent } from '@store/calendar/models';
import { CreateEventsByCalendar, UpdateEventsByCalendar } from '@store/calendar/actions';
import { areObjectsEqual } from '@lib/objectUtil';
import { getDateTime } from '@lib/timeUtil';

interface EventAddEditModalProps {
  calendarName: string;
}
export const EventAddEditModal = ({ calendarName }: EventAddEditModalProps): JSX.Element => {
  const initCalendarEvent = useSelector((state) => selectAddModalEvent(state, calendarName));

  const core = useSelector(selectCoreCalendars);

  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent>(initCalendarEvent);
  const calendarEvents = useSelector((state) => selectSelectedCalendarEventNames(state, calendarName));
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [endDateError, setEndDateError] = useState<string>('');

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
    .add('formId', 'formId', badCharsCheck, isNotEmptyCheck('formId'))
    .build();

  const getTimeString = (calendarDateString: string) => {
    let timeString = calendarDateString?.split('T')[1];
    if (timeString.split(':').length === 1) {
      timeString += ':00';
    }
    return timeString ? timeString.substring(0, 8) : '';
  };
  const setTimeString = (dateString, timeString?) => {
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
  // eslint-disable-next-line react/jsx-no-useless-fragment
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
            disabled={
              validators.haveErrors() || areObjectsEqual(calendarEvent, initCalendarEvent) || endDateError.length > 0
            }
            onClick={() => {
              if (getDateTime(endDate, endTime) < getDateTime(startDate, startTime)) {
                setEndDateError('End of event must be after start of event.');
              } else {
                const validations = {
                  name: calendarEvent.name,
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
                setCalendarEvent(initCalendarEvent);
              }
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
          onBlur={() => {
            validators.checkAll({ name: calendarEvent?.name });
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
          onKeyPress={(name, value, key) => {
            validators.remove('description');
            validators['description'].check(value);
            setCalendarEvent({ ...calendarEvent, description: value });
          }}
          // eslint-disable-next-line
          onChange={(name, value) => {}}
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

      {Object.keys(core).includes(calendarName) && calendarName === 'form-intake' && isEdit && (
        <GoAFormItem error={errors?.['formId']} label="Form Id" mb="3" mt="3">
          <GoAInput
            type="text"
            name="eventName"
            value={calendarEvent?.recordId.substring(calendarEvent?.recordId.lastIndexOf('/') + 1)}
            testId={`calendar-event-modal-name-input`}
            aria-label="eventName"
            disabled={true}
            width="100%"
            onChange={(_, value) => {
              validators.remove('formId');
              validators['formId'].check(value);
              setCalendarEvent({ ...calendarEvent, recordId: value });
            }}
          />
        </GoAFormItem>
      )}

      <GoAGrid minChildWidth="25ch" gap="s">
        <GoAFormItem label="Start date" error={errors?.['start']}>
          <GoAInputDate
            name="StartDate"
            value={calendarEvent?.start ? new Date(calendarEvent.start) : new Date()}
            width="100%"
            testId="calendar-event-modal-start-date-input"
            onChange={(name, value) => {
              setEndDateError('');
              setStartDate(value.toLocaleString());
              setCalendarEvent({ ...calendarEvent, start: setTimeString(value.toLocaleString(), startTime) });
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="Start time">
          <GoAInputTime
            name="StartTime"
            value={startTime}
            step={1}
            width="100%"
            testId="calendar-event-modal-start-time-input"
            disabled={calendarEvent?.isAllDay}
            onChange={(name, value) => {
              setEndDateError('');
              setStartTime(value);
              setCalendarEvent({ ...calendarEvent, start: setTimeString(startDate, value) });
            }}
          />
        </GoAFormItem>
        <GoAFormItem label="End date" error={endDateError}>
          <GoAInputDate
            name="endDate"
            value={calendarEvent?.end ? new Date(calendarEvent?.end) : new Date()}
            width="100%"
            testId="calendar-event-modal-end-date-input"
            onChange={(name, value) => {
              setEndDateError('');
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
              setEndDateError('');
              setEndTime(value);
              setCalendarEvent({ ...calendarEvent, end: setTimeString(endDate, value) });
            }}
          />
        </GoAFormItem>
      </GoAGrid>
    </GoAModal>
  );
};
