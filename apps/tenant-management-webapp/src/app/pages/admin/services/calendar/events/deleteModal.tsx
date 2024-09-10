import React, { useEffect } from 'react';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';
import { ResetModalState } from '@store/session/actions';
import { DeleteCalendarEvent } from '@store/calendar/actions';
import { selectDeleteEventById } from '@store/calendar/selectors';

interface deleteModalProps {
  calendarName;
}

export const DeleteModal = ({ calendarName }: deleteModalProps) => {
  const event = useSelector((state) => selectDeleteEventById(state, calendarName));
  const dispatch = useDispatch();

  // eslint-disable-next-line
  useEffect(() => {}, [event]);
  return (
    <GoAModal
      testId="delete-confirmation"
      open={event !== null}
      heading={'Delete calendar event'}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="delete-cancel"
            onClick={() => {
              dispatch(ResetModalState());
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            variant="destructive"
            testId="delete-confirm"
            onClick={() => {
              dispatch(DeleteCalendarEvent(`${event?.id}`, calendarName));
              dispatch(ResetModalState());
            }}
          >
            Delete
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      Are you sure you wish to delete <b>{`${event?.name}`}</b>?
    </GoAModal>
  );
};
