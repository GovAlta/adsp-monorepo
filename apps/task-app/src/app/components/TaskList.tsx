import { GoADropdown, GoADropdownItem, GoAFormItem, GoATable } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { QueueMetrics as QueueMetricsValue, Task, TaskFilter, TaskUser } from '../state';
import { TaskListItem } from './TaskListItem';
import { QueueMetrics } from './QueueMetrics';

interface TaskListProps {
  className?: string;
  metrics: QueueMetricsValue;
  metricsLoading: boolean;
  filter: TaskFilter;
  tasks: Task[];
  selected: Task;
  open: Task;
  user: TaskUser;
  onSetFilter: (filter: TaskFilter) => void;
  onSelect: (task: Task) => void;
  onAssign: (task: Task) => void;
  onSetPriority: (task: Task) => void;
  onOpen: (task: Task) => void;
}

const TaskListComponent: FunctionComponent<TaskListProps> = ({
  className,
  metrics,
  metricsLoading,
  filter,
  tasks,
  user,
  onSetFilter,
  onSelect,
  onAssign,
  onSetPriority,
  onOpen,
}) => {
  return (
    <div className={className}>
      <div>
        <QueueMetrics metrics={metrics} isLoading={metricsLoading} />
        <GoAFormItem label="Filter" ml="xl">
          <GoADropdown onChange={(_, filter) => onSetFilter(filter as TaskFilter)} value={filter}>
            <GoADropdownItem label="Active" value="active" />
            <GoADropdownItem label="My tasks" value="assigned" />
            <GoADropdownItem label="Pending" value="pending" />
          </GoADropdown>
        </GoAFormItem>
      </div>
      <GoATable mt="l" width="100%">
        <colgroup>
          <col style={{ width: 95 }} />
          <col style={{ width: 90 }} />
          <col />
          <col style={{ width: 95 }} />
          <col />
          <col style={{ width: 330 }} />
        </colgroup>
        <thead>
          <tr>
            <th>Priority</th>
            <th>Age</th>
            <th>Task</th>
            <th>Status</th>
            <th>Assigned</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              user={user}
              onSelect={onSelect}
              onAssign={onAssign}
              onSetPriority={onSetPriority}
              onOpen={onOpen}
            />
          ))}
        </tbody>
      </GoATable>
    </div>
  );
};

export const TaskList = styled(TaskListComponent)`
  z-index: 0;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  > div:first-child {
    display: flex;
    flex-direction: row;
    padding-left: 32px;
    padding-right: 32px;

    > :first-child {
      margin-right: auto;
    }
  }
`;
