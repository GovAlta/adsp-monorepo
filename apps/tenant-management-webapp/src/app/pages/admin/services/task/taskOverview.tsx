import React, { FunctionComponent, useEffect } from 'react';
import { GoAButton } from '@abgov/react-components';
import { OverviewLayout } from '@components/Overview';
import { useHistory } from 'react-router-dom';
interface TaskOverviewProps {
  setActiveEdit: (boolean) => void;
  setActiveIndex: (number) => void;
  disabled?: boolean;
}
export const TaskserviceOverview: FunctionComponent<TaskOverviewProps> = (props) => {
  const { setActiveEdit, setActiveIndex, disabled } = props;

  useEffect(() => {
    setActiveEdit(false);
    setActiveIndex(0);
    history.push({
      pathname: '/admin/services/task',
    });
  }, []);
  const history = useHistory();
  const description = `The task service provides a model for tasks, task queues, and task assignment. Applications can use the task
  service for work management as an aspect to augment domain specific concepts and processes.`;

  return (
    <OverviewLayout
      description={description}
      addButton={
        <GoAButton
          data-testid="add-queue"
          disabled={disabled}
          onClick={() => {
            setActiveEdit(true);
          }}
        >
          Add queue
        </GoAButton>
      }
    />
  );
};
