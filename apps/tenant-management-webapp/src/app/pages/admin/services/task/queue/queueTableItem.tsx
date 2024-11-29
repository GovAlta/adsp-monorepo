import React from 'react';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { useNavigate } from 'react-router-dom';
import { TaskDefinition } from '@store/task/model';
import { taskAppUrlSelector } from '../selectors';
import { useSelector } from 'react-redux';

interface QueueTableItemProps {
  id: string;
  queue: TaskDefinition;
  onDelete?: (TaskDefinition) => void;
}

export const QueueTableItem = ({ id, queue, onDelete }: QueueTableItemProps): JSX.Element => {
  const navigate = useNavigate();
  const taskAppUrl = useSelector(taskAppUrlSelector);
  return (
    <tr>
      <td data-testid="queue-list-namespace">{queue.namespace}</td>
      <td data-testid="queue-list-name">{queue.name}</td>
      <td data-testid="queue-list-action">
        <GoAContextMenuIcon
          testId="task-app-open"
          title="Open Task"
          type="open"
          onClick={() => window.open(`${taskAppUrl}/${queue.namespace}/${queue.name}`)}
        />
        <GoAContextMenuIcon
          testId="queue-definition-edit"
          title="Edit"
          type="create"
          onClick={() => navigate(`edit/${queue.namespace}:${queue.name}`)}
        />
        <GoAContextMenuIcon
          testId={`queue-definition-delete`}
          title="Delete"
          type="trash"
          onClick={() => {
            queue.id = id;
            onDelete(queue);
          }}
        />
      </td>
    </tr>
  );
};
