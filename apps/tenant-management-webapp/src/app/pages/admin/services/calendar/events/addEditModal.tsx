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
import { selectAddModalEvent } from '@store/calendar/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { useValidators } from '@lib/validation/useValidators';
import { isNotEmptyCheck, wordMaxLengthCheck, duplicateNameCheck, badCharsCheck } from '@lib/validation/checkInput';
import { ResetModalState } from '@store/session/actions';
import { CheckBoxWrapper } from '../styled-components';
import { CalendarEvent } from '@store/calendar/models';
import { CreateEventsByCalendar } from '@store/calendar/actions';
import moment from 'moment';

interface EventAddEditModalProps {
  calendarName: string;
}
export const EventAddEditModal = ({ calendarName }: EventAddEditModalProps): JSX.Element => {
  const initCalendarEvent = useSelector(selectAddModalEvent);
  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent>(initCalendarEvent);
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('description', 'description', wordMaxLengthCheck(250, 'Description'))
    .build();
  // eslint-disable-next-line
  useEffect(() => {}, [initCalendarEvent]);
  // eslint-disable-next-line

  const dispatch = useDispatch();
  return (
    <GoAModal
      open={initCalendarEvent !== null}
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
              console.log('calendarEvent', calendarEvent);
              dispatch(CreateEventsByCalendar(calendarName, calendarEvent));
              dispatch(ResetModalState());
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
            const description = value;
            validators.remove('description');
            validators['description'].check(description);
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
          <GoAFormItem label="Start time">
            <GoAInputDateTime
              name="Start time"
              value={new Date().toISOString()}
              width="100%"
              testId="calendar-event-modal-start-time-input"
              onChange={(name, value) => {
                setCalendarEvent({ ...calendarEvent, start: new Date(value).toISOString() });
              }}
            />
          </GoAFormItem>
          <GoAFormItem label="End time">
            <GoAInputDateTime
              name="dateTimeExample"
              value={new Date()}
              width="100%"
              testId="calendar-event-modal-end-time-input"
              onChange={(name, value) => {
                setCalendarEvent({ ...calendarEvent, end: new Date(value).toISOString() });
              }}
            />
          </GoAFormItem>
        </div>
      )}
    </GoAModal>
  );
};
