import { Task, TaskUser } from '../../state';
import { TaskCompleteProps } from './TaskDetailsHost';

export interface TaskDetailsProps {
  user: TaskUser;
  task: Task;
  isExecuting: boolean;
  onClose: () => void;
  onStart: () => void;
  onCancel: (reason: string) => void;
  onComplete: (data: TaskCompleteProps) => void;
}

export const TASK_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  STOPPED: 'Stopped',
  CANCELLED: 'Cancelled',
};
