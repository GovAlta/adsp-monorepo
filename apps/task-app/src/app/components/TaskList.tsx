import { GoADropdown, GoADropdownItem, GoAFormItem, GoATable } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import { Task, TaskFilter, TaskMetric, TaskUser } from '../state';
import { TaskMetrics } from './TaskMetrics';
import { TaskListItem } from './TaskListItem';

interface TaskListProps {
  className?: string;
  metrics: TaskMetric[];
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

export const TaskList: FunctionComponent<TaskListProps> = ({
  className,
  metrics,
  filter,
  tasks,
  open,
  user,
  onSetFilter,
  onSelect,
  onAssign,
  onSetPriority,
  onOpen,
}) => {
  return (
    <div className={className} data-opened={!!open}>
      <div>
        <TaskMetrics metrics={metrics} />
        <GoAFormItem label="Filter" mr="s">
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
              isOpen={open?.id === task.id}
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
