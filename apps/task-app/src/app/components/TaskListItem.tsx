import { GoAButton, GoAButtonGroup, GoASkeleton } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import { styled } from 'styled-components';
import { Task, TaskUser } from '../state';

export function formatTaskAge(createdOn: Date): string {
  if (!createdOn) {
    return '';
  }

  const hours = Math.round((Date.now() - createdOn.getTime()) / 36e5);
  if (hours < 24) {
    return `${hours} hours`;
  } else {
    return `${Math.round((hours * 10) / 24) / 10} days`;
  }
}

export interface TaskListItemProps {
  task: Task;
  user: TaskUser;
  initializingUser: boolean;
  onSelect: (task: Task) => void;
  onAssign: (task: Task) => void;
  onSetPriority: (task: Task) => void;
  onOpen: (task: Task) => void;
}

const ActionSkeleton = styled.div`
  width: 100px;
  margin: -10px -18px -10px 0;
`;

export const TaskListItem: FunctionComponent<TaskListItemProps> = ({
  task,
  user,
  initializingUser,
  onSelect,
  onAssign,
  onSetPriority,
  onOpen,
}) => {
  return (
    <tr onClick={() => onSelect(task)}>
      <td>{task.priority}</td>
      <td>{formatTaskAge(task.createdOn)}</td>
      <td>
        <span>{task.name}</span> - <span>{task.description}</span>
      </td>
      <td>{task.status}</td>
      <td>{task.assignment?.assignedTo ? task.assignment.assignedTo.name : 'No one'}</td>
      <td>
        <GoAButtonGroup alignment="end" gap="compact">
          {initializingUser && (
            <>
              <ActionSkeleton>
                <GoASkeleton type="header" size={4} />
              </ActionSkeleton>
              <ActionSkeleton>
                <GoASkeleton type="header" size={4} />
              </ActionSkeleton>
            </>
          )}
          {user.isAssigner && (
            <>
              <GoAButton size="compact" type="tertiary" onClick={() => onAssign(task)}>
                Assign
              </GoAButton>
              <GoAButton size="compact" type="tertiary" onClick={() => onSetPriority(task)}>
                Set priority
              </GoAButton>
            </>
          )}
          {!user.isAssigner && user.isWorker && (
            <GoAButton
              size="compact"
              type="tertiary"
              onClick={() => onAssign(task)}
              disabled={task.assignment?.assignedTo?.id === user.id}
            >
              Assign to me
            </GoAButton>
          )}
          <GoAButton size="compact" type="secondary" trailingIcon="open" onClick={() => onOpen(task)}>
            Open
          </GoAButton>
        </GoAButtonGroup>
      </td>
    </tr>
  );
};

export default TaskListItem;
