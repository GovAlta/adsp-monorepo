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

export const NotificationMetrics: FunctionComponent = () => {
  const metrics = useSelector((state: RootState) => state.notification.metrics);

  return (
    <section>
      <Title>
        <h2>Notification information</h2>
        <p>for week of {moment().format('MMMM Do')}</p>
      </Title>
      <Metrics
        metrics={[
          { id: 'notifications-sent', name: 'Sent notifications', value: metrics.notificationsSent },
          { id: 'notifications-failed', name: 'Failed notifications', value: metrics.notificationsFailed },
        ]}
      />
    </section>
  );
};
