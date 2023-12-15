import { GoABlock, GoAContainer } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import { TaskMetric } from '../state';

interface TaskMetricsProps {
  metrics: TaskMetric[];
}

export const TaskMetrics: FunctionComponent<TaskMetricsProps> = ({ metrics }) => {
  return (
    <GoABlock mt="m">
      {metrics.map((metric) => (
        <GoAContainer key={metric.name} type="non-interactive" accent="thin">
          <label>{metric.name}</label>
          <div style={{ marginTop: 16 }}>
            <span
              style={{
                fontWeight: 'bold',
                fontSize: 'xx-large',
                marginRight: 6,
              }}
            >
              {metric.value}
            </span>
            <span style={{ fontWeight: 'lighter' }}>{metric.unit}</span>
          </div>
        </GoAContainer>
      ))}
    </GoABlock>
  );
};

export default TaskMetrics;
