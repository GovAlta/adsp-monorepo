import React, { useEffect } from 'react';
import { GoabButton, GoabModal, GoabButtonGroup } from '@abgov/react-components';
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
    <GoabModal
      testId="delete-confirmation"
      open={event !== null}
      heading={'Delete calendar event'}
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="delete-cancel"
            onClick={() => {
              dispatch(ResetModalState());
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            variant="destructive"
            testId="delete-confirm"
            onClick={() => {
              dispatch(DeleteCalendarEvent(`${event?.id}`, calendarName));
              dispatch(ResetModalState());
            }}
          >
            Delete
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      Are you sure you wish to delete <b>{`${event?.name}`}</b>?
    </GoabModal>
  );
};
