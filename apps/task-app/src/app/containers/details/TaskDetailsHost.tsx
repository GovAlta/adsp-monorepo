import { FunctionComponent, Suspense, lazy } from 'react';
import styled from 'styled-components';
import { busySelector, openTaskSelector, queueUserSelector } from '../../state';
import { useSelector } from 'react-redux';
import { TaskDetailsProps } from './types';

// Lazy import detail containers for bundle code splitting and application load performance.
const Placeholder = lazy(() => import('./Placeholder'));
const TaskForm = lazy(() => import('./TaskForm'));

interface TaskDetailsHostProps {
  className?: string;
}

const TaskDetailsHostComponent: FunctionComponent<TaskDetailsHostProps> = ({ className }) => {
  const user = useSelector(queueUserSelector);
  const open = useSelector(openTaskSelector);
  const busy = useSelector(busySelector);

  let TaskDetails: FunctionComponent<TaskDetailsProps> = Placeholder;
  if (open?.recordId?.startsWith('urn:ads:platform:form-service:v1:/forms/')) {
    TaskDetails = TaskForm;
  }

  return (
    <div data-opened={!!open} className={className}>
      {open && (
        <Suspense>
          <TaskDetails task={open} user={user} isExecuting={busy.executing} />
        </Suspense>
      )}
    </div>
  );
};

export const TaskDetailsHost = styled(TaskDetailsHostComponent)`
  z-index: 0;
  position: relative;
  display: none;
  flex: 1;
  padding-left: 32px;
  padding-right: 32px;
  padding-bottom: 32px;

  > * {
    height: 100%;
    width: 100%;
  }

  &[data-opened='true'] {
    display: block;
  }
`;
