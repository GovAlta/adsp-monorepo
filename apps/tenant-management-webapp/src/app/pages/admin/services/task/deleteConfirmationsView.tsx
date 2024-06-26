import React, { FunctionComponent, useEffect, useState } from 'react';

import { GoAButton, GoAButtonGroup, GoAModal } from '@abgov/react-components-new';
import { useDispatch, useSelector } from 'react-redux';

import { TableDiv } from './styled-components';
import { DeleteModal } from '@components/DeleteModal';

import { deleteTaskQueue } from '@store/task/action';

import { RootState } from '@store/index';
import { TaskDefinition } from '@store/task/model';

interface taskTableProps {
  queue: TaskDefinition;
}

export const DeleteConfirmationsView: FunctionComponent<taskTableProps> = ({ queue }) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showUnableToDeleteConfirmation, setShowUnableToDeleteConfirmation] = useState(false);
  const dispatch = useDispatch();

  let tasks = useSelector((state: RootState) => {
    return state?.task?.tasks;
  });

  useEffect(() => {
    if (tasks?.length > 0 && tasks && tasks[0].queue.name === queue.name) {
      setShowUnableToDeleteConfirmation(true);
    } else if (tasks) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      tasks = [];
      setShowDeleteConfirmation(true);
    }
  }, [tasks]);
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  useEffect(() => {}, [tasks]);

  return (
    <TableDiv key="task">
      <DeleteModal
        title="Delete task queue"
        isOpen={showDeleteConfirmation}
        content={
          <div>
            <div>
              Are you sure you wish to delete <b>{`${queue.name}?`}</b>
            </div>
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deleteTaskQueue(queue));
        }}
      />
      <GoAModal
        testId="queue-delete-modal"
        open={showUnableToDeleteConfirmation}
        heading="Queue current in use"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              testId="queue-delete-modal-cancel-btn"
              onClick={() => {
                setShowUnableToDeleteConfirmation(false);
              }}
            >
              Okay
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <p>
          You are unable to delete the queue type <b>{`${queue.name}`}</b> because there are tasks within the queue type
        </p>
      </GoAModal>
      <br />
    </TableDiv>
  );
};
