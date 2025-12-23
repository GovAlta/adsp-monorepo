import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '@store/index';
import { clearTasks, getTaskQueues, getTasks, SetQueueTask, updateQueueTask } from '@store/task/action';
import { QueueTaskDefinition, defaultQueuedTask } from '@store/task/model';

import { renderNoItem } from '@components/NoItem';
import {
  GoabButton,
  GoabDropdown,
  GoabDropdownItem,
  GoabFormItem,
  GoabSkeleton,
  GoabCircularProgress,
} from '@abgov/react-components';
import { TaskModal } from './taskModal';
import { ButtonPadding, ProgressWrapper } from '../styled-components';
import { TaskListTable } from './tasksTable';
import { LoadMoreWrapper } from '@components/styled-components';
import { getSortedQueues } from '../taskUtil';
import {
  GoabTextAreaOnKeyPressDetail,
  GoabInputOnChangeDetail,
  GoabDropdownOnChangeDetail,
} from '@abgov/ui-components-common';
interface VisibleProps {
  visible: boolean;
}

const Visible = styled.div<VisibleProps>`
  visibility: ${(props) => `${props.visible ? 'visible' : 'hidden'}`};
`;

export const TasksList = (): JSX.Element => {
  const dispatch = useDispatch();
  const [openAddTask, setOpenAddTask] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [editedTask, setUpdatedTask] = useState<QueueTaskDefinition>(defaultQueuedTask);
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  const tasks = useSelector((state: RootState) => {
    return state?.task?.tasks;
  });
  const next = useSelector((state: RootState) => state.task.nextEntries);

  const taskQueues = useSelector((state: RootState) => {
    return getSortedQueues(state?.task?.queues);
  });

  useEffect(() => {
    dispatch(getTaskQueues());
  }, [dispatch]);

  useEffect(() => {
    if (selectedTask.length > 0) {
      dispatch(getTasks(taskQueues[selectedTask]));
    }
  }, [selectedTask]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [openAddTask]);

  const reset = () => {
    setOpenAddTask(false);
  };

  const handleSave = (task) => {
    try {
      if (modalType === 'new') {
        dispatch(SetQueueTask(task));
      } else {
        dispatch(updateQueueTask(task));
      }
    } catch (error) {
      console.error('Error while saving task:', error);
    }
  };

  const onNext = () => {
    dispatch(getTasks(taskQueues[selectedTask], next));
  };

  return (
    <section>
      {!indicator.show && Object.keys(taskQueues).length === 0 && renderNoItem('task queues')}

      <GoabFormItem label="Select a queue">
        {indicator.show && Object.keys(taskQueues).length === 0 && <GoabSkeleton type="text" key={1}></GoabSkeleton>}
        {Object.keys(taskQueues).length > 0 && (
          <GoabDropdown
            name="Queues"
            value={selectedTask}
            onChange={(detail: GoabDropdownOnChangeDetail) => {
              dispatch(clearTasks());
              setSelectedTask(detail.value);
            }}
            aria-label="select-task-dropdown"
            width="100%"
            testId="task-select-definition-dropdown"
          >
            {Object.keys(taskQueues).map((item) => (
              <GoabDropdownItem
                name="Queues"
                key={item}
                label={item}
                value={item}
                testId={`${item}-get-task-options`}
              />
            ))}
          </GoabDropdown>
        )}
      </GoabFormItem>

      {selectedTask !== '' && (
        <div>
          <ButtonPadding>
            <GoabButton
              testId="add-queue-btn"
              disabled={selectedTask === ''}
              onClick={() => {
                setModalType('new');
                setUpdatedTask(defaultQueuedTask);
                setOpenAddTask(true);
              }}
            >
              Add task
            </GoabButton>
          </ButtonPadding>
        </div>
      )}
      {!indicator.show &&
        selectedTask !== '' &&
        tasks &&
        Object.keys(tasks).length === 0 &&
        renderNoItem('queue tasks')}
      {selectedTask !== '' && tasks && Object.keys(tasks).length !== 0 && (
        <Visible visible={selectedTask !== '' && tasks && Object.keys(tasks).length !== 0}>
          <TaskListTable
            tasks={tasks}
            onEditTask={(updatedTask) => {
              setModalType('edit');
              setUpdatedTask(updatedTask);
              setOpenAddTask(true);
            }}
          />
          {!next && indicator.show && (
            <ProgressWrapper>
              <GoabCircularProgress visible={indicator.show} size="small" />
            </ProgressWrapper>
          )}
          {next && (
            <LoadMoreWrapper>
              <GoabButton testId="task-load-more-btn" key="task-load-more-btn" type="tertiary" onClick={onNext}>
                Load more
              </GoabButton>
            </LoadMoreWrapper>
          )}
        </Visible>
      )}
      <TaskModal
        open={openAddTask}
        queue={selectedTask}
        type={modalType}
        initialValue={editedTask}
        onCancel={() => {
          reset();
        }}
        onSave={handleSave}
      />
    </section>
  );
};
