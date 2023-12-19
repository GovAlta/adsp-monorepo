import { FunctionComponent, useEffect } from 'react';
import { QueuesHeader } from '../components/QueuesHeader';
import { QueueList } from '../components/QueueList';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, loadQueues, metricsLoadingSelector, queueMetricsSelector, queuesSelector } from '../state';
import styled from 'styled-components';

interface TaskQueuesProps {
  className?: string;
}

export const TaskQueues: FunctionComponent<TaskQueuesProps> = ({ className }) => {
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(loadQueues());
  }, [dispatch]);

  const queues = useSelector(queuesSelector);
  const metrics = useSelector(queueMetricsSelector);
  const metricsLoading = useSelector(metricsLoadingSelector);

  return (
    <div className={className}>
      <QueuesHeader />
      <QueueList queues={queues} metrics={metrics} metricsLoading={metricsLoading} />
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
