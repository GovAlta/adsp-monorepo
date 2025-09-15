import { GoAButton, GoAButtonGroup } from '@abgov/react-components';
import { FunctionComponent } from 'react';
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
  onSelect: (task: Task) => void;
  onAssign: (task: Task) => void;
  onSetPriority: (task: Task) => void;
  onOpen: (task: Task) => void;
}

export const TaskListItem: FunctionComponent<TaskListItemProps> = ({
  task,
  user,
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
          {user.isAssigner && (
            <>
              <GoAButton size="compact" type="secondary" onClick={() => onAssign(task)}>
                Assign
              </GoAButton>
              <GoAButton size="compact" type="secondary" onClick={() => onSetPriority(task)}>
                Set priority
              </GoAButton>
            </>
          )}
          {!user.isAssigner && user.isWorker && (
            <GoAButton
              size="compact"
              type="secondary"
              onClick={() => onAssign(task)}
              disabled={task.assignment?.assignedTo?.id === user.id}
            >
              Assign to me
            </GoAButton>
          )}
          <GoAButton size="compact" type="primary" onClick={() => onOpen(task)}>
            Open
          </GoAButton>
        </GoAButtonGroup>
      </td>
    </tr>
  );
};

export default TaskListItem;
