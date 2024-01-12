import { Task, TaskUser } from '../../state';

export interface TaskDetailsProps {
  className?: string;
  user: TaskUser;
  task: Task;
  isExecuting: boolean;
  onClose: () => void;
  onStart: () => void;
  onCancel: (reason: string) => void;
  onComplete: () => void;
}
