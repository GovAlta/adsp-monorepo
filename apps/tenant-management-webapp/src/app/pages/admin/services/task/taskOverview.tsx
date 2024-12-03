import React, { useEffect, useState } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoAButton } from '@abgov/react-components-new';
import { useNavigate } from 'react-router-dom';
import { QueueModal } from './queue/queueModal';
import { useDispatch } from 'react-redux';
import { defaultTaskQueue, TaskDefinition } from '@store/task/model';
import { UpdateTaskQueue } from '@store/task/action';

interface TaskOverviewProps {
  setOpenAddTask: (val: boolean) => void;

  setActiveEdit: (edit: boolean) => void;
  setActiveIndex: (index: number) => void;
  activeEdit: boolean;
  openAddTask: boolean;
}

export const TaskOverview = ({
  setActiveEdit,
  setActiveIndex,
  activeEdit,
  openAddTask,
  setOpenAddTask,
}: TaskOverviewProps): JSX.Element => {
  const [selectedQueue, setSelectedQueue] = useState<TaskDefinition>(defaultTaskQueue);

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const reset = () => {
    setSelectedQueue(defaultTaskQueue);
    setOpenAddTask(false);
    document.body.style.overflow = 'unset';
  };

  return (
    <OverviewLayout
      description={
        <section>
          <p>
            The task service provides a model for tasks, task queues, and task assignment. Applications can use the task
            service for work management as an aspect to augment domain specific concepts and processes.
          </p>
        </section>
      }
      addButton={
        <GoAButton
          testId="add-queue"
          onClick={() => {
            setActiveEdit(true);
            setOpenAddTask(true);
          }}
        >
          Add queue
        </GoAButton>
      }
    />
  );
};
