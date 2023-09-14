import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getTaskQueues, deleteTaskQueue, getTasks, UpdateTaskQueue } from '@store/task/action';
import { TaskDefinition, defaultTaskQueue } from '@store/task/model';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAButton } from '@abgov/react-components-new';
import { DeleteModal } from '@components/DeleteModal';
import { GoABadge } from '@abgov/react-components-new';
import { QueueListTable } from './queueTable';
import { QueueModal } from './queueModal';
import { Buttonpadding } from './styled-components';

interface AddEditQueueProps {
  openAddDefinition: boolean;
}
export const QueuesList = ({ openAddDefinition }: AddEditQueueProps): JSX.Element => {
  const dispatch = useDispatch();
  const [modalType, setModalType] = useState('');
  const [editQueue, setEditQueue] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [openAddQueue, setOpenAddQueue] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<TaskDefinition>(defaultTaskQueue);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const tasks = useSelector((state: RootState) => {
    return state?.task?.tasks;
  });

  const taskQueues = useSelector((state: RootState) => {
    return Object.entries(state?.task?.queues)
      .sort((template1, template2) => {
        return template1[1].name.localeCompare(template2[1].name);
      })
      .reduce((tempObj, [taskDefinitionId, taskDefinitionData]) => {
        tempObj[taskDefinitionId] = taskDefinitionData;
        return tempObj;
      }, {});
  });

  useEffect(() => {
    dispatch(getTaskQueues());
  }, []);

  useEffect(() => {
    if (selectedQueue.name.length > 0) {
      dispatch(getTasks(selectedQueue));
    }
  }, [selectedQueue]);

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, []);

  useEffect(() => {
    if (openAddDefinition) {
      reset();
      setOpenAddQueue(true);
    }
  }, [openAddDefinition]);

  // eslint-disable-next-line

  const reset = () => {
    setEditQueue(false);
    setSelectedQueue(defaultTaskQueue);
    setOpenAddQueue(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  useEffect(() => {}, [taskQueues]);

  return (
    <section>
      <div>
        <Buttonpadding>
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
        </Buttonpadding>
      </div>
      <PageIndicator />
      {!indicator.show && Object.keys(taskQueues).length === 0 && renderNoItem('task queues')}
      {!indicator.show && Object.keys(taskQueues).length > 0 && (
        <QueueListTable
          taskQueues={taskQueues}
          onDelete={(currentTemplate) => {
            setShowDeleteConfirmation(true);
            setSelectedQueue(currentTemplate);
          }}
        />
      )}
      <DeleteModal
        isOpen={showDeleteConfirmation}
        title="Delete task queue"
        content={
          <div>
            <div>
              Are you sure you wish to delete <b>{`${selectedQueue?.name}?`}</b>
            </div>
            <div style={{ margin: '10px 0' }}>
              {tasks && Object.keys(tasks).length > 0 && (
                <GoABadge
                  key="unended-tasks"
                  type="emergency"
                  icon
                  content={`${selectedQueue?.name} contains unended tasks`}
                />
              )}
            </div>
          </div>
        }
        onCancel={() => setShowDeleteConfirmation(false)}
        onDelete={() => {
          setShowDeleteConfirmation(false);
          dispatch(deleteTaskQueue(selectedQueue));
        }}
      />

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
