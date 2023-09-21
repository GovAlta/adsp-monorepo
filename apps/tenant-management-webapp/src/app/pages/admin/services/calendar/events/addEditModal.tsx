import React, { useEffect, useState } from 'react';
import {
  GoAModal,
  GoAFormItem,
  GoAButton,
  GoAButtonGroup,
  GoAInput,
  GoATextArea,
  GoAInputDateTime,
  GoACheckbox,
} from '@abgov/react-components-new';
import { selectAddModalEvent, selectSelectedCalendarEventNames } from '@store/calendar/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, duplicateNameCheck, badCharsCheck } from '@lib/validation/checkInput';
import { ResetModalState } from '@store/session/actions';
import { CheckBoxWrapper } from '../styled-components';
import { CalendarEvent } from '@store/calendar/models';
import { CreateEventsByCalendar, UpdateEventsByCalendar } from '@store/calendar/actions';

interface EventAddEditModalProps {
  calendarName: string;
}
export const EventAddEditModal = ({ calendarName }: EventAddEditModalProps): JSX.Element => {
  const initCalendarEvent = useSelector((state) => selectAddModalEvent(state, calendarName));
  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent>(null);
  const calendarEvents = useSelector((state) => selectSelectedCalendarEventNames(state, calendarName));

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
  // eslint-disable-next-line
  useEffect(() => {
    if (calendarEvent === null || calendarEvent?.name !== initCalendarEvent?.name) {
      setCalendarEvent(initCalendarEvent);
    }
  }, [initCalendarEvent]);
  // eslint-disable-next-line
  const isEdit = !!calendarEvent?.id;
  const modalTitle = `${isEdit ? 'Edit' : 'Add'} calendar event`;
  const dispatch = useDispatch();
  return (
    <GoAModal
      open={initCalendarEvent !== null}
      heading={modalTitle}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="calendar-modal-cancel"
            onClick={() => {
              dispatch(ResetModalState());
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="calendar-modal-save"
            disabled={validators.haveErrors()}
            onClick={() => {
              const validations = {
                name: calendarEvent.name,
                start: calendarEvent.start,
                end: calendarEvent.end,
              };
              if (!validators.checkAll(validations)) {
                return;
              }
              if (isEdit) {
                dispatch(UpdateEventsByCalendar(calendarName, calendarEvent.id.toString(), calendarEvent));
              } else {
                dispatch(CreateEventsByCalendar(calendarName, calendarEvent));
              }
              dispatch(ResetModalState());
              validators.clear();
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
          name="name"
          value={calendarEvent?.name}
          testId={`calendar-event-modal-name-input`}
          aria-label="name"
          width="100%"
          onChange={(name, value) => {
            const validations = {
              name: value,
            };
            validators.remove('name');
            validators.checkAll(validations);
            setCalendarEvent({ ...calendarEvent, name: value });
          }}
        />
      </GoAFormItem>
      <GoAFormItem error={errors?.['description']} label="Description">
        <GoATextArea
          name="description"
          value={calendarEvent?.description}
          testId={`calendar-event-modal-description-input`}
          aria-label="description"
          width="100%"
          onChange={(name, value) => {
            validators.remove('description');
            validators['description'].check(value);
            setCalendarEvent({ ...calendarEvent, description: value });
          }}
        />
      </GoAFormItem>
      <CheckBoxWrapper>
        <GoACheckbox
          name="dateTimeExample"
          checked={calendarEvent?.isPublic}
          text={'Is public '}
          onChange={(name, value) => {
            setCalendarEvent({ ...calendarEvent, isPublic: value });
          }}
        />
      </CheckBoxWrapper>
      <CheckBoxWrapper>
        <GoACheckbox
          name="dateTimeExample"
          checked={calendarEvent?.isAllDay}
          text={'Is all day'}
          onChange={(name, value) => {
            setCalendarEvent({ ...calendarEvent, isAllDay: value });
          }}
        />
      </CheckBoxWrapper>
      {!calendarEvent?.isAllDay && (
        <div>
          <GoAFormItem label="Start time" error={errors?.['start']}>
            <GoAInputDateTime
              name="Start time"
              value={new Date().toISOString()}
              width="100%"
              testId="calendar-event-modal-start-time-input"
              onChange={(name, value) => {
                validators.remove('start');
                validators['start'].check(value);
                setCalendarEvent({ ...calendarEvent, start: new Date(value).toISOString() });
              }}
            />
          </GoAFormItem>
          <GoAFormItem label="End time" error={errors?.['end']}>
            <GoAInputDateTime
              name="dateTimeExample"
              value={new Date()}
              width="100%"
              testId="calendar-event-modal-end-time-input"
              onChange={(name, value) => {
                validators.remove('end');
                validators['end'].check(value);
                setCalendarEvent({ ...calendarEvent, end: new Date(value).toISOString() });
              }}
            />
          </GoAFormItem>
        </div>
      )}
    </GoAModal>
  );
};
