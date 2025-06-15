import React, { FunctionComponent, useEffect, useState } from 'react';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { QueueTaskDefinition } from '@store/task/model';
import { ActionIconsDiv } from '../../styled-components';
import { MoreDetails } from '../styled-components';

interface TaskTableItemProps {
  id: string;
  task: QueueTaskDefinition;
  onEditTask?: (QueueTaskDefinition) => void;
}

export const TaskTableItem: FunctionComponent<TaskTableItemProps> = ({ id, task, onEditTask }: TaskTableItemProps) => {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setShowDetails(false);
  }, [task]);

  const createdOnDate = new Date(task.createdOn);

  // Calculate the time difference from the current date and time
  const currentDate = new Date();
  const timeDifference = currentDate.getTime() - createdOnDate.getTime();

  // Calculate days and hours
  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hoursDifference = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  // Format the createdOn date
  const formattedCreatedOn = `${createdOnDate
    .toISOString()
    .substr(0, 10)}, ${daysDifference} days, ${hoursDifference} hours`;

  return (
    <>
      <tr>
        <td data-testid="task-list-namespace">{task.name}</td>
        <td data-testid="task-list-name">{task.description}</td>
        <td data-testid="queue-list-action">
          <ActionIconsDiv>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={() => setShowDetails(!showDetails)}
              testId="toggle-details-visibility"
            />
            <GoAContextMenuIcon
              testId="task-definition-edit"
              title="Edit"
              type="create"
              onClick={() => onEditTask && onEditTask(task)}
            />
          </ActionIconsDiv>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td
            colSpan={5}
            style={{
              padding: '0px',
            }}
          >
            <MoreDetails>
              <p>Status</p>
              <span>{task.status}</span>
              <p>Priority</p>
              <span>{task.priority}</span>
              <p>Age</p>
              <span>{formattedCreatedOn}</span>
            </MoreDetails>
          </td>
        </tr>
      )}
    </>
  );
};
