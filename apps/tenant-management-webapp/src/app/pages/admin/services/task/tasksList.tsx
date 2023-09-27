import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getTaskQueues, getTasks, SetQueueTask, updateQueueTask } from '@store/task/action';
import { QueueTaskDefinition, defaultQueuedTask } from '@store/task/model';

import { renderNoItem } from '@components/NoItem';
import { GoAButton, GoADropdown, GoADropdownItem, GoAFormItem, GoASkeleton } from '@abgov/react-components-new';
import { TaskModal } from './taskModal';
import { ButtonPadding } from './styled-components';
import { TaskListTable } from './tasksTable';

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
    if (selectedTask.length > 0) {
      dispatch(getTasks(taskQueues[selectedTask]));
    }
  }, [selectedTask]);

  useEffect(() => {
    document.body.style.overflow = 'unset';
  }, [openAddTask]);

  const reset = () => {
    setOpenAddTask(false);
  };

  const handleSave = async (task) => {
    try {
      if (modalType === 'new') {
        await dispatch(SetQueueTask(task));
      } else {
        await dispatch(updateQueueTask(task));
      }
      setTimeout(() => {
        dispatch(getTasks(taskQueues[selectedTask]));
      }, 1000);
    } catch (error) {
      console.error('Error while saving task:', error);
    }
  };

  return (
    <section>
      {!indicator.show && Object.keys(taskQueues).length === 0 && renderNoItem('task queues')}
      {Object.keys(taskQueues).length > 0 && (
        <GoAFormItem label="Select a queue">
          {indicator.show && Object.keys(taskQueues).length === 0 && <GoASkeleton type="text" key={1}></GoASkeleton>}
          {Object.keys(taskQueues).length > 0 && (
            <GoADropdown
              name="Queues"
              value={selectedTask}
              onChange={(name: string, selectedTask: string) => {
                setSelectedTask(selectedTask);
              }}
              aria-label="select-task-dropdown"
              width="100%"
              testId="task-select-definition-dropdown"
            >
              {Object.keys(taskQueues).map((item) => (
                <GoADropdownItem
                  name="Queues"
                  key={item}
                  label={item}
                  value={item}
                  testId={`${item}-get-task-options`}
                />
              ))}
            </GoADropdown>
          )}
        </GoAFormItem>
      )}
      {selectedTask !== '' && (
        <div>
          <ButtonPadding>
            <GoAButton
              testId="add-queue-btn"
              disabled={selectedTask === ''}
              onClick={() => {
                setModalType('new');
                setUpdatedTask(defaultQueuedTask);
                setOpenAddTask(true);
              }}
            >
              Add Task
            </GoAButton>
          </ButtonPadding>
        </div>
      )}

      {!indicator.show &&
        selectedTask !== '' &&
        tasks &&
        Object.keys(tasks).length === 0 &&
        renderNoItem('queue tasks')}
      {selectedTask !== '' && tasks && Object.keys(tasks).length !== 0 && (
        <TaskListTable
          tasks={tasks}
          onEditTask={(updatedTask) => {
            setModalType('edit');
            setUpdatedTask(updatedTask);
            setOpenAddTask(true);
          }}
        />
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
