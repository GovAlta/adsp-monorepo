import { AdspId } from '@core-services/app-common';
import { FunctionComponent, Suspense, lazy, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { busySelector, openTaskSelector, queueUserSelector, taskActions } from '../../state';
import { TaskDetailsProps } from './types';

// Lazy import detail containers for bundle code splitting and application load performance.
const Placeholder = lazy(() => import('./Placeholder'));
const FormSubmissionReviewTask = lazy(() => import('./FormSubmissionReviewTask'));
const FileTask = lazy(() => import('./FileTask'));

interface TaskDetailsHostProps {
  className?: string;
}

const TaskDetailsHostComponent: FunctionComponent<TaskDetailsHostProps> = ({ className }) => {
  const user = useSelector(queueUserSelector);
  const open = useSelector(openTaskSelector);
  const busy = useSelector(busySelector);

  const params = useParams<{ tenantName: string; namespace: string; name: string; taskId: string }>();
  const dispatch = useDispatch();

  useEffect(() => {
    if (params.taskId !== open?.id) {
      dispatch(taskActions.setOpenTask(params.taskId));
    }
  }, [dispatch, params, open]);

  const history = useHistory();

  let TaskDetails: FunctionComponent<TaskDetailsProps> = Placeholder;
  if (AdspId.isAdspId(open?.recordId)) {
    if (open.recordId.startsWith('urn:ads:platform:form-service:v1:/forms/')) {
      TaskDetails = FormSubmissionReviewTask;
    } else if (open.recordId.startsWith('urn:ads:platform:file-service:v1:/files/')) {
      TaskDetails = FileTask;
    }
  }

  return (
    <div data-opened={!!open} className={className}>
      {open && (
        <Suspense>
          <TaskDetails
            task={open}
            user={user}
            isExecuting={busy.executing}
            onClose={() => history.push(`/${params.tenantName}/${params.namespace}/${params.name}`)}
          />
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
