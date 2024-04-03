import React from 'react';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { useNavigate } from 'react-router-dom';
import { TaskDefinition } from '@store/task/model';

interface QueueTableItemProps {
  id: string;
  queue: TaskDefinition;
  onDelete?: (TaskDefinition) => void;
}

export const QueueTableItem = ({ id, queue, onDelete }: QueueTableItemProps): JSX.Element => {
  const navigate = useNavigate();
  return (
    <tr>
      <td data-testid="queue-list-namespace">{queue.namespace}</td>
      <td data-testid="queue-list-name">{queue.name}</td>
      <td data-testid="queue-list-action">
        <GoAContextMenuIcon
          testId="task-definition-edit"
          title="Edit"
          type="create"
          onClick={() => navigate(`edit/${queue.namespace}:${queue.name}`)}
        />
        <GoAContextMenuIcon
          testId={`task-definition-delete`}
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
