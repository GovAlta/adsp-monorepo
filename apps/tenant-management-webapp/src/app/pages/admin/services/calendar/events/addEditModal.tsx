import React, { useEffect, useState } from 'react';
import {
  GoabModal,
  GoabFormItem,
  GoabButton,
  GoabButtonGroup,
  GoabInput,
  GoabTextArea,
  GoabCheckbox,
  GoabGrid,
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
import { HelpTextComponent } from '@components/HelpTextComponent';
import { readOnlyCalendars } from '.';
import {
  GoabTextAreaOnChangeDetail,
  GoabTextAreaOnKeyPressDetail,
  GoabInputOnChangeDetail,
  GoabCheckboxOnChangeDetail,
} from '@abgov/ui-components-common';
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
  const descErrMessage = 'Calendar event description can not be over 180 characters';
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
    <GoabModal
      open={initCalendarEvent !== null}
      heading={modalTitle}
      testId="add-edit-calendar-event-modal"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="calendar-event-modal-cancel"
            onClick={() => {
              validators.clear();
              setCalendarEvent(initCalendarEvent);
              dispatch(ResetModalState());
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
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
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem error={errors?.['name']} label="Name">
        <GoabInput
          type="text"
          name="eventName"
          value={calendarEvent?.name}
          testId={`calendar-event-modal-name-input`}
          aria-label="eventName"
          disabled={readOnlyCalendars.includes(calendarName)}
          width="100%"
          onChange={(detail: GoabInputOnChangeDetail) => {
            validators.remove('name');
            validators['name'].check(detail.value);
            setCalendarEvent({ ...calendarEvent, name: detail.value });
          }}
          onBlur={() => {
            validators.checkAll({ name: calendarEvent?.name });
          }}
        />
      </GoabFormItem>
      <GoabFormItem error={errors?.['description']} label="Description" mb={'xl'}>
        <GoabTextArea
          name="description"
          value={calendarEvent?.description}
          testId={`calendar-event-modal-description-input`}
          aria-label="description"
          disabled={readOnlyCalendars.includes(calendarName)}
          width="100%"
          onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
            validators.remove('description');
            validators['description'].check(detail.value);
            setCalendarEvent({ ...calendarEvent, description: detail.value });
          }}
          // eslint-disable-next-line
          onChange={(detail: GoabTextAreaOnChangeDetail) => {}}
        />
        <HelpTextComponent
          length={calendarEvent?.description?.length || 0}
          maxLength={180}
          descErrMessage={descErrMessage}
          errorMsg={errors?.['description']}
        />
      </GoabFormItem>

      <GoabCheckbox
        name="isPublicCheckbox"
        checked={calendarEvent?.isPublic}
        text={'Is public '}
        disabled={readOnlyCalendars.includes(calendarName)}
        onChange={(detail: GoabCheckboxOnChangeDetail) => {
          setCalendarEvent({ ...calendarEvent, isPublic: detail.checked });
        }}
      />

      <GoabCheckbox
        name="isAllDayCheckbox"
        checked={calendarEvent?.isAllDay}
        text={'Is all day'}
        disabled={readOnlyCalendars.includes(calendarName)}
        onChange={(detail: GoabCheckboxOnChangeDetail) => {
          setCalendarEvent({ ...calendarEvent, isAllDay: detail.checked });
        }}
      />

      {Object.keys(core).includes(calendarName) && calendarName === 'form-intake' && isEdit && (
        <GoabFormItem error={errors?.['formId']} label="Form Id" mb="3" mt="3">
          <GoabInput
            type="text"
            name="eventName"
            value={calendarEvent?.recordId.substring(calendarEvent?.recordId.lastIndexOf('/') + 1)}
            testId={`calendar-event-modal-name-input`}
            aria-label="eventName"
            disabled={true}
            width="100%"
            onChange={(detail: GoabInputOnChangeDetail) => {
              validators.remove('formId');
              validators['formId'].check(detail.value);
              setCalendarEvent({ ...calendarEvent, recordId: detail.value });
            }}
          />
        </GoabFormItem>
      )}

      <GoabGrid minChildWidth="25ch" gap="s">
        <GoabFormItem label="Start date" error={errors?.['start']}>
          <GoabInput
            type="date"
            name="StartDate"
            value={(calendarEvent?.start ? new Date(calendarEvent.start) : new Date()).toISOString().slice(0, 10)}
            width="100%"
            disabled={readOnlyCalendars.includes(calendarName)}
            testId="calendar-event-modal-start-date-input"
            onChange={(detail: GoabInputOnChangeDetail) => {
              setEndDateError('');
              setStartDate(detail.value.toLocaleString());
              setCalendarEvent({ ...calendarEvent, start: setTimeString(detail.value.toLocaleString(), startTime) });
            }}
          />
        </GoabFormItem>
        <GoabFormItem label="Start time">
          <GoabInput
            name="StartTime"
            type="time"
            value={startTime}
            step={1}
            width="100%"
            testId="calendar-event-modal-start-time-input"
            disabled={calendarEvent?.isAllDay || readOnlyCalendars.includes(calendarName)}
            onChange={(detail: GoabInputOnChangeDetail) => {
              setEndDateError('');
              setStartTime(detail.value);
              setCalendarEvent({ ...calendarEvent, start: setTimeString(startDate, detail.value) });
            }}
          />
        </GoabFormItem>
        <GoabFormItem label="End date" error={endDateError}>
          <GoabInput
            type="date"
            name="endDate"
            value={(calendarEvent?.end ? new Date(calendarEvent?.end) : new Date()).toISOString().slice(0, 10)}
            width="100%"
            disabled={readOnlyCalendars.includes(calendarName)}
            testId="calendar-event-modal-end-date-input"
            onChange={(detail: GoabInputOnChangeDetail) => {
              setEndDateError('');
              setEndDate(detail.value.toLocaleString());
              setCalendarEvent({ ...calendarEvent, end: setTimeString(detail.value.toLocaleString(), endTime) });
            }}
          />
        </GoabFormItem>

        <GoabFormItem label="End time">
          <GoabInput
            type="time"
            name="endTime"
            value={endTime}
            step={1}
            width="100%"
            disabled={calendarEvent?.isAllDay || readOnlyCalendars.includes(calendarName)}
            testId="calendar-event-modal-end-time-input"
            onChange={(detail: GoabInputOnChangeDetail) => {
              setEndDateError('');
              setEndTime(detail.value);
              setCalendarEvent({ ...calendarEvent, end: setTimeString(endDate, detail.value) });
            }}
          />
        </GoabFormItem>
      </GoabGrid>
    </GoabModal>
  );
};
