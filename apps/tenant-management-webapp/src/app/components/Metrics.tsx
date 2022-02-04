import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { Grid, GridItem } from './Grid';

interface Metric {
  id: string;
  name: string;
  value?: number;
}

interface MetricsProps {
  metrics: Metric[];
}

const MetricGrid = styled(Grid)`
  justify-content: left;
`;

const MetricGridItem = styled(GridItem)`
  border: 1px solid #ccc;
  border-bottom-width: 0;
  padding: 1rem;
  &:last-child {
    border-bottom-width: 1px;
  }
  @media (min-width: 768px) {
    border: 1px solid #ccc;
    border-right-width: 0;
    &:last-child {
      border-right-width: 1px;
    }
  }
`;

const Count = styled.div`
  font-size: var(--fs-2xl);
  font-weight: var(--fw-bold);
  padding-bottom: 1rem;
`;

export const Metrics: FunctionComponent<MetricsProps> = ({ metrics }: MetricsProps) => {
  return (
    <MetricGrid>
      {metrics.map(({ id, name, value }) => (
        <MetricGridItem key={id} md={4}>
          <Count id={id}>{value?.toFixed() || '-'}</Count>
          {name}
        </MetricGridItem>
      ))}
    </MetricGrid>
  );
};
