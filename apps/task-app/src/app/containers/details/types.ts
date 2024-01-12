import { Task, TaskUser } from '../../state';

export interface TaskDetailsProps {
  user: TaskUser;
  task: Task;
  isExecuting: boolean;
  onClose: () => void;
  onStart: () => void;
  onCancel: (reason: string) => void;
  onComplete: () => void;
}
