import { Task, TaskUser } from '../../state';
import { TaskCompleteProps } from './TaskDetailsHost';

export interface TaskDetailsProps {
  user: TaskUser;
  task: Task;
  isExecuting: boolean;
  onClose: () => void;
  onStart: () => void;
  onCancel: (reason: string) => void;
  onComplete: () => void;
  onSetCompleteData: (data: TaskCompleteProps) => void;
}
