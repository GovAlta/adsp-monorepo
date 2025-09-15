import { FunctionComponent, ReactNode } from 'react';
import { TaskMetric } from '../state';
import { GoAContainer } from '@abgov/react-components';

interface MetricProps {
  metric: TaskMetric;
  children?: ReactNode;
}

export const Metric: FunctionComponent<MetricProps> = ({ metric, children }) => {
  return (
    <GoAContainer type="non-interactive" accent="thin" padding="compact">
      <label>{metric.name}</label>
      <div style={{ marginTop: 16 }}>
        {children || (
          <span
            style={{
              fontWeight: 'bold',
              fontSize: 'xx-large',
              marginRight: 6,
            }}
          >
            {metric.value || metric.value === 0 ? metric.value : '-'}
          </span>
        )}
        <div style={{ fontSize: 'smaller' }}>{metric.unit}</div>
      </div>
    </GoAContainer>
  );
};
