import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getTaskQueues, getTasks, UpdateTaskQueue } from '@store/task/action';
import { TaskDefinition, defaultTaskQueue } from '@store/task/model';
import { renderNoItem } from '@components/NoItem';
import { GoAButton, GoACircularProgress } from '@abgov/react-components';
import { QueueListTable } from './queueTable';
import { QueueModal } from './queueModal';
import { ProgressWrapper } from '../styled-components';
import { DeleteConfirmationsView } from './deleteConfirmationsView';
import { getSortedQueues } from '../taskUtil';
interface AddEditQueueProps {
  openAddTask: boolean;
  setOpenAddTask: (val: boolean) => void;

  setActiveEdit: (edit: boolean) => void;
  setActiveIndex: (index: number) => void;
  activeEdit: boolean;
}
export const QueuesList = ({ openAddTask }: AddEditQueueProps): JSX.Element => {
  const dispatch = useDispatch();
  const [modalType, setModalType] = useState('');
  const [editQueue, setEditQueue] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [openAddQueue, setOpenAddQueue] = useState(false);
  const [deleteAction, setDeleteAction] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<TaskDefinition>(defaultTaskQueue);
  const next = useSelector((state: RootState) => state.task.nextEntries);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const taskQueues = useSelector((state: RootState) => {
    return getSortedQueues(state?.task?.queues);
  });

  useEffect(() => {
    dispatch(getTaskQueues());
  }, [dispatch]);

  useEffect(() => {
    if (selectedQueue.name.length > 0) {
      dispatch(getTasks(selectedQueue, next));
    }
    if (deleteAction) {
      setShowDeleteConfirmation(true);
    }
  }, [selectedQueue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (openAddTask) {
      reset();
      setOpenAddQueue(true);
    }
  }, [openAddTask]);

  const reset = () => {
    setEditQueue(false);
    setSelectedQueue(defaultTaskQueue);
    setOpenAddQueue(false);
    document.body.style.overflow = 'unset';
  };

  return (
    <section>
      <div>
        <GoAButton
          testId="add-queue-btn"
          onClick={() => {
            setSelectedQueue(defaultTaskQueue);
            setModalType('new');
            setEditQueue(true);
          }}
        >
          Add queue
        </GoAButton>
      </div>
      {indicator.show && Object.keys(taskQueues).length === 0 && !showDeleteConfirmation && (
        <ProgressWrapper>
          <GoACircularProgress visible={indicator.show} size="small" />
        </ProgressWrapper>
      )}
      {!indicator.show && Object.keys(taskQueues).length === 0 && renderNoItem('queues')}
      {Object.keys(taskQueues).length > 0 && (
        <QueueListTable
          taskQueues={taskQueues}
          onDelete={(currentTemplate) => {
            setSelectedQueue(currentTemplate);
            setDeleteAction(true);
          }}
        />
      )}
      {showDeleteConfirmation && selectedQueue && (
        <DeleteConfirmationsView queue={selectedQueue}></DeleteConfirmationsView>
      )}

      {(editQueue || openAddQueue) && (
        <QueueModal
          open={true}
          initialValue={selectedQueue}
          type={openAddQueue ? 'new' : modalType}
          onCancel={() => {
            reset();
          }}
          onSave={(queue) => dispatch(UpdateTaskQueue(queue))}
        />
      )}
    </section>
  );
};
