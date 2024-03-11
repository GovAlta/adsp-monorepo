import { FunctionComponent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-6';
import styled from 'styled-components';
import { QueuesHeader } from '../components/QueuesHeader';
import { QueueList } from '../components/QueueList';
import {
  AppDispatch,
  loadQueues,
  metricsLoadingSelector,
  queueMetricsSelector,
  queuesSelector,
  taskActions,
} from '../state';

interface TaskQueuesProps {
  className?: string;
}

export const TaskQueues: FunctionComponent<TaskQueuesProps> = ({ className }) => {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(loadQueues());
    dispatch(taskActions.resetTask());
  }, [dispatch]);

  const queues = useSelector(queuesSelector);
  const metrics = useSelector(queueMetricsSelector);
  const metricsLoading = useSelector(metricsLoadingSelector);

  const navigate = useNavigate();

  return (
    <div className={className}>
      <QueuesHeader />
      <QueueList
        queues={queues}
        metrics={metrics}
        metricsLoading={metricsLoading}
        onOpenQueue={(queue) => {
          dispatch(taskActions.resetTask());
          navigate(`${queue.namespace}/${queue.name}`);
        }}
      />
    </div>
  );
};

export default styled(TaskQueues)`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;
