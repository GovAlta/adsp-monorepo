import { GoabContainer, GoabIconButton } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { QueueDefinition, QueueMetrics as QueueMetricsValue } from '../state';
import { QueueMetrics } from './QueueMetrics';

interface QueueListItemProps {
  className?: string;
  queue: QueueDefinition;
  metrics?: QueueMetricsValue;
  metricsLoading: Record<string, boolean>;
  onOpen: (queue: QueueDefinition) => void;
}

const QueueListItemComponent: FunctionComponent<QueueListItemProps> = ({
  className,
  queue,
  metrics,
  metricsLoading,
  onOpen,
}) => {
  return (
    <GoabContainer type="interactive" accent="thin" padding="compact">
      <div className={className}>
        <div>
          <h3>
            {queue.displayName ? (
              <span>{queue.displayName}</span>
            ) : (
              <>
                <span>{queue.namespace}</span>
                <span>:</span>
                <span>{queue.name}</span>
              </>
            )}
          </h3>
          <div>
            <GoabIconButton title="create" icon="open" size="large" onClick={() => onOpen(queue)} />
          </div>
        </div>
        <QueueMetrics metrics={metrics} isLoading={metricsLoading[`${queue.namespace}:${queue.name}`]} />
      </div>
    </GoabContainer>
  );
};

export const QueueListItem = styled(QueueListItemComponent)`
  > div:first-child {
    display: flex;
    *:last-child {
      margin-left: auto;
    }
  }
`;
