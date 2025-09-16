import { Grid, GridItem } from '@core-services/app-common';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { QueueDefinition, QueueMetrics } from '../state';
import { QueueListItem } from './QueueListItem';

interface QueueListComponentProps {
  className?: string;
  queues: QueueDefinition[];
  metrics: Record<string, QueueMetrics>;
  metricsLoading: Record<string, boolean>;
  onOpenQueue: (queue: QueueDefinition) => void;
}

const QueueListComponent: FunctionComponent<QueueListComponentProps> = ({
  className,
  queues,
  metrics,
  metricsLoading,
  onOpenQueue,
}) => {
  return (
    <Grid className={className}>
      {queues.map((queue) => (
        <GridItem key={`${queue.namespace}:${queue.name}`} vSpacing={1}>
          <QueueListItem
            queue={queue}
            metrics={metrics[`${queue.namespace}:${queue.name}`]}
            metricsLoading={metricsLoading}
            onOpen={onOpenQueue}
          />
        </GridItem>
      ))}
    </Grid>
  );
};

export const QueueList = styled(QueueListComponent)`
  padding: var(--goa-space-l) var(--goa-space-3xl) var(--goa-space-xl) var(--goa-space-3xl);
  flex: 1;
  overflow: auto;
`;
