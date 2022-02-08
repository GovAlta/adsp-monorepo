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

export const EventMetrics: FunctionComponent = () => {
  const metrics = useSelector((state: RootState) => state.event.metrics);

  return (
    <section>
      <Title>
        <h2>Event information</h2>
        <p>for week of {moment().format('MMMM Do')}</p>
      </Title>
      <Metrics
        metrics={[
          { id: 'events-total', name: 'Total events', value: metrics.totalEvents },
          { id: 'events-per-day', name: 'Average events per day', value: metrics.avgPerDay },
        ]}
      />
    </section>
  );
};
