import { AdspId } from '@core-services/app-common';
import { FunctionComponent, Suspense, lazy, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  busySelector,
  openTask,
  openTaskSelector,
  queueUserSelector,
  selectTopic,
  selectedTopicSelector,
  topicsSelector,
} from '../../state';
import { TaskDetailsProps } from './types';
import CommentsViewer from '../CommentsViewer';
import { GoAIconButton } from '@abgov/react-components-new';

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
  const topics = useSelector(topicsSelector);
  const topic = useSelector(selectedTopicSelector);

  const params = useParams<{ tenantName: string; namespace: string; name: string; taskId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (params.taskId !== open?.id) {
      dispatch(openTask({ namespace: params.namespace, name: params.name, taskId: params.taskId }));
    }
  }, [dispatch, params, open]);

  const history = useHistory();

  const [showComments, setShowComments] = useState(false);

  let TaskDetails: FunctionComponent<TaskDetailsProps> = Placeholder;
  if (AdspId.isAdspId(open?.recordId)) {
    if (open.recordId.startsWith('urn:ads:platform:form-service:v1:/forms/')) {
      TaskDetails = FormSubmissionReviewTask;
    } else if (open.recordId.startsWith('urn:ads:platform:file-service:v1:/files/')) {
      TaskDetails = FileTask;
    }
  }

  return (
    <div key={params.taskId} data-opened={!!open} className={className}>
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
      {open && (
        <div className="commentsPane" data-show={showComments}>
          <CommentsViewer key={open.urn} />
        </div>
      )}
      <GoAIconButton
        disabled={!open || !topics[open.urn]}
        icon={showComments ? 'chatbubble-ellipses' : 'chatbubble'}
        size="large"
        onClick={() => {
          setShowComments(!showComments);
          if (topic?.resourceId !== open?.urn) {
            dispatch(selectTopic({ resourceId: open.urn }));
          }
        }}
      />
    </div>
  );
};

export const TaskDetailsHost = styled(TaskDetailsHostComponent)`
  z-index: 0;
  position: relative;
  display: none;
  flex: 1;

  & > :first-child {
    flex: 1;
    padding: var(--goa-spacing-l);
    padding-top: var(--goa-spacing-m);
  }

  & > .commentsPane {
    display: none;
    width: 40vw;
    border-right: 1px solid var(--goa-color-greyscale-200);
    background: white;
    > * {
      height: 100%;
    }
  }

  & > .commentsPane[data-show='true'] {
    display: block;
  }

  & > :last-child {
    z-index: 2;
    position: absolute;
    bottom: var(--goa-spacing-l);
    left: var(--goa-spacing-l);
  }

  &[data-opened='true'] {
    display: flex;
    flex-direction: row-reverse;
  }
`;
