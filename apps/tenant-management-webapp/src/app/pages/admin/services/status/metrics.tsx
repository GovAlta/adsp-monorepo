import React, { FunctionComponent } from 'react';
import moment from 'moment';
import { Metrics } from '@components/Metrics';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

export const StatusMetrics: FunctionComponent = () => {
  const metrics = useSelector((state: RootState) => state.serviceStatus.metrics);

  return (
    <section>
      <Title>
        <h2>Application health information</h2>
        <p>for week of {moment().format('MMMM Do')}</p>
      </Title>
      <Metrics
        metrics={[
          { id: 'unhealthy-count', name: 'Times unhealthy', value: metrics.unhealthyCount },
          { id: 'unhealthy-total-duration', name: 'Total unhealthy minutes', value: metrics.totalUnhealthyDuration },
          {
            id: 'unhealthy-avg-duration',
            name: 'Longest unhealthy period (mins)',
            value: metrics.maxUnhealthyDuration,
          },
        ]}
      />
      {metrics.leastHealthyApp && (
        <p>
          Least healthy application: {metrics.leastHealthyApp.name} (
          {metrics.leastHealthyApp.totalUnhealthyDuration?.toFixed()} mins unhealthy)
        </p>
      )}
    </section>
  );
};
