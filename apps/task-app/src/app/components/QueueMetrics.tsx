import { GoABlock } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { QueueMetrics as QueueMetricsValue } from '../state';
import { Metric } from './Metric';

interface QueueMetricsProps {
  metrics: QueueMetricsValue;
  isLoading: boolean;
}

export const QueueMetrics: FunctionComponent<QueueMetricsProps> = ({ metrics, isLoading }) => {
  return (
    <GoABlock mt="m">
      <Metric
        metric={{
          name: 'Priority',
          unit: 'Normal / High / Urgent',
        }}
      >
        <PriorityMetric
          isLoading={isLoading}
          normal={metrics?.priority.Normal}
          high={metrics?.priority.High}
          urgent={metrics?.priority.Urgent}
        />
      </Metric>
      <Metric
        metric={{
          name: 'Lead time',
          unit: 'Queue / Work',
        }}
      >
        <DurationMetric
          isLoading={isLoading}
          queue={parseFloat(metrics?.queue?.avg || '0')}
          completion={parseFloat(metrics?.completion?.avg || '0')}
        />
      </Metric>
      <Metric
        metric={{
          name: 'Queue rate',
          unit: 'In / Out',
        }}
      >
        <RateMetric
          isLoading={isLoading}
          since={metrics?.rate?.since ? new Date(metrics?.rate?.since) : null}
          created={metrics?.rate?.created}
          completed={metrics?.rate?.completed}
          cancelled={metrics?.rate?.cancelled}
        />
      </Metric>
      <Metric
        metric={{
          name: 'Pending / In Progress',
          value: `${metrics?.status.Pending} / ${metrics?.status['In Progress']}`,
          unit: 'tasks',
        }}
      />
      {/* <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        height="50px"
        style={{ marginTop: 'auto', marginBottom: 'auto' }}
      >
        <path fill="#f1f1f1" d="M17 7.908H8v4h9V14l4-4.043-4-4.043v1.994z" />
        <path
          fill="#f1f1f1"
          d="M13.919 6.908V2a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v15.908a2 2 0 0 0 2 2h9.919a2 2 0 0 0 2-2v-5h-6.87v-6z"
        />
      </svg> */}
      {/* <Metric
        metric={{
          name: 'In Progress',
          value: metrics?.status['In Progress'],
          unit: 'tasks',
        }}
      /> */}
    </GoABlock>
  );
};

interface PriorityMetricProps {
  className?: string;
  isLoading: boolean;
  normal: number;
  high: number;
  urgent: number;
}

function calculatePriorityWidth(value: number, total: number) {
  return Math.floor((150 * value) / total);
}

const PriorityMetric = styled(({ className, isLoading, normal, high, urgent }: PriorityMetricProps) => (
  <div className={className} data-loading={isLoading}>
    <span>{(!isLoading && normal) || ''}</span>
    <span>{(!isLoading && high) || ''}</span>
    <span>{(!isLoading && urgent) || ''}</span>
    <span></span>
  </div>
))`
  height: 35px;
  width: 160px;
  margin: 0;
  & > span {
    height: 35px;
    line-height: 35px;
    text-align: center;
    display: inline-block;
    vertical-align: middle;
  }
  & > span:nth-child(1) {
    width: ${({ isLoading, normal, high, urgent }) =>
      `${isLoading ? 0 : calculatePriorityWidth(normal, normal + high + urgent)}px`};
    color: var(--goa-color-text-light);
    background: var(--goa-color-info-default);
  }
  & > span:nth-child(2) {
    width: ${({ isLoading, normal, high, urgent }) =>
      `${isLoading ? 0 : calculatePriorityWidth(high, normal + high + urgent)}px`};
    background: var(--goa-color-warning-default);
  }
  & > span:nth-child(3) {
    width: ${({ isLoading, normal, high, urgent }) =>
      `${isLoading ? 0 : calculatePriorityWidth(urgent, normal + high + urgent)}px`};
    color: var(--goa-color-text-light);
    background: var(--goa-color-emergency-default);
  }
  & > span:nth-child(4) {
    width: ${({ isLoading, normal, high, urgent }) => (isLoading || (!normal && !high && !urgent) ? '150px' : 0)};
    background: var(--goa-color-greyscale-100);
  }
  &[data-loading='true'] > span:nth-child(4) {
    animation: pulse 2s infinite ease-in-out;
  }
  @keyframes pulse {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  }
`;

export function formatDuration(duration: number): string {
  if (!duration) {
    return '';
  }

  const minutes = duration / 60;
  const hours = minutes / 60;

  let result = '';
  if (minutes <= 120) {
    result = `${Math.round(minutes)}m`;
  } else if (hours <= 48) {
    result = `${Math.round(hours)}h`;
  } else {
    result = `${Math.round(hours / 24)}d`;
  }
  return result;
}

interface DurationMetricProps {
  className?: string;
  isLoading: boolean;
  queue: number;
  completion: number;
}

const DurationMetric = styled(({ className, isLoading, queue, completion }: DurationMetricProps) => (
  <div className={className} data-loading={isLoading}>
    <div>
      <span></span>
      <span></span>
    </div>
    <span>{!isLoading && formatDuration(queue)}</span>
    <span>{!isLoading && formatDuration(completion)}</span>
  </div>
))`
  height: 35px;
  width: 140px;
  margin: 0;
  overflow: hidden;
  position: relative;
  & > div {
    height: 70px;
    width: 70px;
    position: relative;
    margin-left: auto;
    margin-right: auto;
    transform: scaleX(2);
  }
  & > div > span {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    position: absolute;
    box-sizing: border-box;
    border-radius: 100%;
    border-top: 35px solid;
  }
  & > div > span:first-child {
    border-color: ${({ isLoading, queue, completion }) =>
      isLoading || (!queue && !completion) ? 'var(--goa-color-greyscale-100)' : 'var(--goa-color-info-default)'};
    transform: ${({ isLoading, queue, completion }) => {
      return isLoading ? ';' : `rotate(-${Math.floor((180 * completion) / (queue + completion)) || 0}deg);`;
    }}
    z-index: 1;
  }
  & > div > span:last-child {
    border-color: rgb(60, 154, 243);
    visibility: ${({ isLoading, queue, completion }) => (isLoading || (!queue && !completion) ? 'hidden' : 'visible')};
  }
  &[data-loading='true'] > div > span:first-child {
    animation: pulse 2s infinite ease-in-out;
  }
  & > span {
    color: var(--goa-color-text-light);
    position: absolute;
    top: 0;
    margin: 8px 16px 0 16px;
  }
  & > span:last-child {
    right: 0;
  }
  @keyframes pulse {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  }
`;

function formatRate(since: Date, count: number) {
  if (!since || !count) {
    return;
  }

  const hours = (Date.now() - since.getTime()) / 36e5;
  const perHour = count / hours;
  const perDay = (count * 24) / hours;
  return perDay < 1 ? '< 1/d' : perHour > 1 ? `${Math.round(perHour)}/h` : `${Math.round(perDay)}/d`;
}

interface RateMetricProps {
  className?: string;
  isLoading: boolean;
  since: Date;
  created: number;
  completed: number;
  cancelled: number;
}

const RateMetric = styled(({ className, isLoading, since, created, completed, cancelled }: RateMetricProps) => (
  <div className={className} data-loading={isLoading}>
    <span>{formatRate(since, created)}</span>
    <span>{formatRate(since, completed + cancelled)}</span>
  </div>
))`
  height: 35px;
  width: 160px;
  margin: 0;
  position: relative;
  & > span {
    position: absolute;
    height: 35px;
    line-height: 35px;
    text-align: center;
    display: inline-block;
    vertical-align: middle;
    color: var(--goa-color-text-light);
  }
  & > span:first-child {
    right: 80px;
    width: ${({ created, completed, cancelled }) =>
      created < completed + cancelled
        ? `${Math.max(Math.round((created * 80) / (completed + cancelled)), 26)}px;`
        : '80px;'};
    background: ${({ created }) => (!created ? 'var(--goa-color-greyscale-100)' : 'var(--goa-color-info-default)')};
  }
  & > span:last-child {
    left: 81px;
    width: ${({ created, completed, cancelled }) =>
      created > completed + cancelled
        ? `${Math.max(Math.round(((completed + cancelled) * 80) / created), 26)}px;`
        : '80px;'};
    background: ${({ completed, cancelled }) =>
      !completed && !cancelled ? 'var(--goa-color-greyscale-100)' : ' rgb(60, 154, 243)'};
  }
  &[data-loading='true'] > span {
    width: 80px;
    background: var(--goa-color-greyscale-100);
    animation: pulse 2s infinite ease-in-out;
  }
  @keyframes pulse {
    0% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  }
`;
