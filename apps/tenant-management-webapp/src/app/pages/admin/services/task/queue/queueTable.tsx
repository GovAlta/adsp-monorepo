import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { QueueTableItem } from './queueTableItem';
import { TaskDefinition } from '@store/task/model';

export interface QueueTableProps {
  taskQueues: Record<string, TaskDefinition>;
  onDelete?: (taskQueue) => void;
  onEdit?: (taskQueue) => void;
}
export const QueueListTable: FunctionComponent<QueueTableProps> = ({ taskQueues, onDelete }) => {
  const newQueues = JSON.parse(JSON.stringify(taskQueues)) as Record<string, TaskDefinition>;

  return (
    <DataTable data-testid="task-queue-table">
      <thead data-testid="task-queue-table-header">
        <tr>
          <th data-testid="task-queue-table-header-namespace">Namespace</th>
          <th data-testid="task-queue-table-header-name">Name</th>
          <th id="task-queue-action" data-testid="task-queue-table-header-action">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(newQueues).map((queue) => {
          return <QueueTableItem key={queue} id={queue} queue={newQueues[queue]} onDelete={onDelete} />;
        })}
      </tbody>
    </DataTable>
  );
};
