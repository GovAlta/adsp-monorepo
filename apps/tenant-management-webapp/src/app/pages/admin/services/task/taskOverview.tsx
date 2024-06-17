import React, { useEffect } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoAButton } from '@abgov/react-components-new';
import { useNavigate } from 'react-router-dom';

interface TaskOverviewProps {
  setOpenAddTask: (val: boolean) => void;
}

export const TaskOverview = ({ setOpenAddTask }: TaskOverviewProps): JSX.Element => {
  useEffect(() => {
    setOpenAddTask(false);
    navigate('/admin/services/task');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useNavigate();

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
            navigate('/admin/services/task?queues=true');
            setOpenAddTask(true);
          }}
        >
          Add queue
        </GoAButton>
      }
    />
  );
};
