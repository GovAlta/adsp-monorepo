import React, { useEffect } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoAButton } from '@abgov/react-components-new';
import { useNavigate } from 'react-router-dom';

interface TaskOverviewProps {
  setOpenAddDefinition: (val: boolean) => void;
}

export const TaskOverview = ({ setOpenAddDefinition }: TaskOverviewProps): JSX.Element => {
  useEffect(() => {
    setOpenAddDefinition(false);
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
            setOpenAddDefinition(true);
            navigate('/admin/services/task?definitions=true');
          }}
        >
          Add queue
        </GoAButton>
      }
    />
  );
};
