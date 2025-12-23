import React, { FunctionComponent, useEffect, useState } from 'react';

import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';
import { useDispatch, useSelector } from 'react-redux';

import { TableDiv } from '../styled-components';
import { DeleteModal } from '@components/DeleteModal';
import { DeleteCalendar } from '@store/calendar/actions';

import { RootState } from '@store/index';

import { selectSelectedCalendarEvents } from '@store/calendar/selectors';

interface calendarTableProps {
  calendarName;
}

export const DeleteConfirmationsView: FunctionComponent<calendarTableProps> = ({ calendarName }) => {
  const selectedEvents = useSelector((state: RootState) => selectSelectedCalendarEvents(state, calendarName));
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showUnableToDeleteConfirmation, setShowUnableToDeleteConfirmation] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    if (selectedEvents?.length > 0) {
      setShowUnableToDeleteConfirmation(true);
    } else if (selectedEvents) {
      setShowDeleteConfirmation(true);
    }
  }, [selectedEvents]);

  return (
    <TableDiv key="calendar">
      <DeleteModal
        title="Delete calendar"
        isOpen={showDeleteConfirmation}
        onCancel={() => {
          setShowDeleteConfirmation(false);
        }}
        content={
          <div>
            Are you sure you wish to delete <b> {calendarName}</b>?
          </div>
        }
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(DeleteCalendar(calendarName));
        }}
      />
      <GoabModal
        testId="file-type-delete-modal"
        open={showUnableToDeleteConfirmation}
        heading="Calendar current in use"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              type="secondary"
              testId="file-type-delete-modal-cancel-btn"
              onClick={() => {
                setShowUnableToDeleteConfirmation(false);
              }}
            >
              Okay
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <p>
          You are unable to delete the calender type <b>{`${calendarName}`}</b> because there are events within the
          calendar type
        </p>
      </GoabModal>
      <br />
    </TableDiv>
  );
};
