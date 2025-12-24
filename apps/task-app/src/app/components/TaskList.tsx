import { GoabDropdown, GoabDropdownItem, GoabFormItem, GoabTable } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { QueueMetrics as QueueMetricsValue, Task, TaskFilter, TaskUser } from '../state';
import { TaskListItem } from './TaskListItem';
import { QueueMetrics } from './QueueMetrics';
import { GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';
interface TaskListProps {
  className?: string;
  metrics: QueueMetricsValue;
  metricsLoading: boolean;
  filter: TaskFilter;
  tasks: Task[];
  selected: Task;
  open: Task;
  user: TaskUser;
  initializingUser: boolean;
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
  initializingUser,
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
        <GoabFormItem label="Filter" ml="xl">
          <GoabDropdown
            onChange={(detail: GoabDropdownOnChangeDetail) => onSetFilter(detail.value as TaskFilter)}
            value={filter}
            width={'100%'}
          >
            <GoabDropdownItem label="Active" value="active" />
            <GoabDropdownItem label="My tasks" value="assigned" />
            <GoabDropdownItem label="Pending" value="pending" />
          </GoabDropdown>
        </GoabFormItem>
      </div>
      <div>
        <GoabTable mt="l" width="100%">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '35%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '35%' }} />
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
                initializingUser={initializingUser}
                onSelect={onSelect}
                onAssign={onAssign}
                onSetPriority={onSetPriority}
                onOpen={onOpen}
              />
            ))}
          </tbody>
        </GoabTable>
      </div>
    </div>
  );
};

export const TaskList = styled(TaskListComponent)`
  z-index: 0;
  flex: 1;
  overflow: auto;
  flex-direction: column;

  > div {
    margin: 0 var(--goa-space-2xl) 0 var(--goa-space-2xl);
  }

  > div:first-child {
    margin-top: var(--goa-space-s);
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;

    > :last-child {
      margin-left: auto;
      flex-grow: 0;
    }
  }
`;
