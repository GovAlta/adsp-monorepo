import { FunctionComponent, ReactNode } from 'react';
import { Task } from '../state';

interface TaskDetailsProps {
  className?: string;
  open: Task;
  children: ReactNode;
}

export const TaskDetails: FunctionComponent<TaskDetailsProps> = ({ className, open, children }) => {
  return (
    <div data-opened={!!open} className={className}>
      {open && children}
    </div>
  );
};
