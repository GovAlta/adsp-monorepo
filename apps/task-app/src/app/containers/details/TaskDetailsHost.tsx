import { FunctionComponent, Suspense, lazy, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import {
  AppDispatch,
  busySelector,
  cancelTask,
  completeTask,
  formSelector,
  openTask,
  openTaskSelector,
  queueUserSelector,
  selectTopic,
  selectedTopicSelector,
  startTask,
  topicsSelector,
  updateFormDisposition,
} from '../../state';
import CommentsViewer from '../CommentsViewer';
import { GoAIconButton } from '@abgov/react-components-new';
import { getRegisteredDetailsComponents } from './register';

// Built in task detail components are loaded via import here.
// Custom ones will be imported via a script element with src to URL of bundle file.
import './FileTask';
import './FormSubmissionReviewTask';

// Lazy import detail containers for bundle code splitting and application load performance.
const Placeholder = lazy(() => import('./Placeholder'));

interface TaskDetailsHostProps {
  className?: string;
  onClose: () => void;
}
export interface TaskCompleteProps {
  formId: string;
  submissionId: string;
  dispositionReason: string;
  dispositionStatus: string;
}

const TaskDetailsHostComponent: FunctionComponent<TaskDetailsHostProps> = ({ className, onClose }) => {
  const user = useSelector(queueUserSelector);
  const open = useSelector(openTaskSelector);
  const busy = useSelector(busySelector);
  const topics = useSelector(topicsSelector);
  const topic = useSelector(selectedTopicSelector);
  const form = useSelector(formSelector);

  const [completedData, setOnCompleteData] = useState<TaskCompleteProps>({} as TaskCompleteProps);
  const definitionId = form.forms[form.selected]?.formDefinitionId;
  const definition = form.definitions[definitionId];
  const params = useParams<{ namespace: string; name: string; taskId: string }>();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (params.taskId !== open?.id) {
      dispatch(openTask({ namespace: params.namespace, name: params.name, taskId: params.taskId }));
    }
  }, [dispatch, params, open]);

  const [showComments, setShowComments] = useState(false);

  const components = getRegisteredDetailsComponents();
  const TaskDetails =
    components.find(({ matcher }) => {
      try {
        return matcher(open);
      } catch (err) {
        return false;
      }
    })?.detailsComponent || Placeholder;

  const onCompleteTask = (data: TaskCompleteProps) => {
    console.log('completedData', data);
    dispatch(
      updateFormDisposition({
        formId: data.formId,
        submissionId: data.submissionId,
        dispositionReason: data.dispositionReason,
        dispositionStatus: data.dispositionStatus,
      })
    ).then(() => {
      dispatch(completeTask({ taskId: open.id }));
    });
  };

  return (
    <div key={params.taskId} data-opened={!!open} className={className}>
      {open && (
        <Suspense>
          <TaskDetails
            task={open}
            user={user}
            isExecuting={busy.executing}
            onClose={onClose}
            onStart={() => dispatch(startTask({ taskId: open.id }))}
            onComplete={(data) => onCompleteTask(data)}
            onCancel={(reason) => dispatch(cancelTask({ taskId: open.id, reason }))}
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

export const ChatBubblePadding = styled.div`
  margin-bottom: 5rem;
  margin-top: 5rem;
`;
export const TaskDetailsHost = styled(TaskDetailsHostComponent)`
  z-index: 0;
  position: relative;
  display: none;
  flex: 1;

  & > :first-child {
    flex: 1;
    padding: var(--goa-space-l);
    padding-top: var(--goa-space-m);
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
    position: absolute;
    bottom: var(--goa-space-xl);
  }

  &[data-opened='true'] {
    display: flex;
    flex-direction: row-reverse;
  }
`;
