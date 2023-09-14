import React, { useEffect } from 'react';
import { OverviewLayout } from '@components/Overview';
import { GoAButton } from '@abgov/react-components-new';
import { useHistory } from 'react-router-dom';

interface TaskOverviewProps {
  setOpenAddDefinition: (val: boolean) => void;
}

export const TaskOverview = ({ setOpenAddDefinition }: TaskOverviewProps): JSX.Element => {
  useEffect(() => {
    setOpenAddDefinition(false);
    history.push({
      pathname: '/admin/services/task',
    });
  }, []);

  const history = useHistory();

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
        <>
          <GoAButton
            testId="add-definition"
            onClick={() => {
              setOpenAddDefinition(true);
              history.push({
                pathname: '/admin/services/task',
                search: '?definitions=true',
              });
            }}
          >
            Add queue
          </GoAButton>
        </>
      }
    />
  );
};
