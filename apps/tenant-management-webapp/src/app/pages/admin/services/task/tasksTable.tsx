import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { TaskTableItem } from './taskTableItem';
import { QueueTaskDefinition } from '@store/task/model';

import { HeaderFont, TableDiv } from './styled-components';

export interface TaskTableProps {
  tasks: QueueTaskDefinition[];
  onEditTask?: (queueTask) => void;
}
export const TaskListTable: FunctionComponent<TaskTableProps> = ({ tasks, onEditTask }) => {
  const newTasks = tasks ? (JSON.parse(JSON.stringify(tasks)) as Record<string, QueueTaskDefinition>) : [];

  return (
    <TableDiv>
      <DataTable data-testid="task-task-table">
        <thead data-testid="task-task-table-header">
          <tr>
            <th data-testid="task-task-table-header-namespace">Name</th>
            <th data-testid="task-task-table-header-name">Description</th>
            <th data-testid="task-task-table-header-name">Action</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(newTasks).map((task) => {
            return <TaskTableItem key={task} id={task} task={newTasks[task]} onEditTask={onEditTask} />;
          })}
        </tbody>
      </DataTable>
    </TableDiv>
  );
};
