import { GoADropdown, GoADropdownItem, GoAFormItem, GoATable } from '@abgov/react-components';
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
          <GoADropdown
            onChange={(_, filter) => onSetFilter(filter as TaskFilter)}
            value={filter}
            relative={true}
            width={'100%'}
          >
            <GoADropdownItem label="Active" value="active" />
            <GoADropdownItem label="My tasks" value="assigned" />
            <GoADropdownItem label="Pending" value="pending" />
          </GoADropdown>
        </GoAFormItem>
      </div>
      <div>
        <GoATable mt="l" width="100%">
          <colgroup>
            <col style={{ width: 80 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 200 }} />
          </colgroup>
          <thead>
            <tr>
              <th>Priority</th>
              <th>Age</th>
              <th>Task</th>
              <th>Status</th>
              <th>Assigned</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
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
    </div>
  );
};

export const TaskList = styled(TaskListComponent)`
  z-index: 0;
  flex: 1;
  overflow: hidden;
  display: contents;
  flex-direction: column;

  > div:first-child {
    margin: var(--goa-space-s) var(--goa-space-l) 0 var(--goa-space-l);
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    > :last-child {
      margin-left: auto;
    }
  }
`;
