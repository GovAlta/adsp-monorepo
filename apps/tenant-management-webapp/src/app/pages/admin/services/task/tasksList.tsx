import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { getTaskQueues, getTasks } from '@store/task/action';
import { TaskDefinition, defaultTaskQueue } from '@store/task/model';
import { PageIndicator } from '@components/Indicator';
import { renderNoItem } from '@components/NoItem';
import { GoAButton, GoADropdown, GoADropdownItem, GoAFormItem, GoASkeleton } from '@abgov/react-components-new';
import { TaskModal } from './taskModal';
import { Buttonpadding } from './styled-components';

export const TasksList = (): JSX.Element => {
  const dispatch = useDispatch();
  const [openAddTask, setOpenAddTask] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<TaskDefinition>(defaultTaskQueue);
  const [selectedTask, setSelectedTask] = useState('');
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

  // eslint-disable-next-line

  const reset = () => {
    setSelectedQueue(defaultTaskQueue);
    setOpenAddTask(false);
  };

  return (
    <section>
      {!indicator.show && Object.keys(taskQueues).length === 0 && renderNoItem('task queues')}
      {!indicator.show && Object.keys(taskQueues).length > 0 && (
        <GoAFormItem label="Select task">
          {indicator.show && Object.keys(taskQueues).length === 0 && <GoASkeleton type="text" key={1}></GoASkeleton>}
          {Object.keys(taskQueues).length > 0 && (
            <GoADropdown
              name="Tasks"
              value={selectedTask}
              onChange={(name: string, selectedTask: string | string[]) => {
                setSelectedTask(selectedTask.toString());
              }}
              aria-label="select-task-dropdown"
              width="100%"
              testId="task-select-definition-dropdown"
            >
              {Object.keys(taskQueues).map((item) => (
                <GoADropdownItem
                  name="Tasks"
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
      <PageIndicator />
      <div>
        <Buttonpadding>
          <GoAButton
            testId="add-queue-btn"
            onClick={() => {
              setOpenAddTask(true);
              setSelectedQueue(defaultTaskQueue);
            }}
          >
            Add Task
          </GoAButton>
        </Buttonpadding>
      </div>
      {openAddTask && (
        <TaskModal
          open={true}
          onCancel={() => {
            reset();
          }}
          onSave={(task) => console.log(task)}
        />
      )}
    </section>
  );
};
