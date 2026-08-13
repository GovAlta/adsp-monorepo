import React, { useEffect } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoabButton } from '@abgov/react-components';

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
  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        <GoabButton size="compact"
          testId="add-queue"
          onClick={() => {
            setActiveEdit(true);
            setOpenAddTask(true);
          }}
        >
          Add queue
        </GoabButton>
      }
    />
  );
};
