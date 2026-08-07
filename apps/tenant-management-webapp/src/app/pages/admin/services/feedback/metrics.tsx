import React, { FunctionComponent } from 'react';
import moment from 'moment';
import { Metrics } from './feedbackMetrics';
import { toDisplayRating } from './ratings';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;
const WeekDiv = styled.div`
  font-size: var(--fs-sm);
  color: #5f5b5b;
`;
export const FeedbackMetrics: FunctionComponent = () => {
  const metrics = useSelector((state: RootState) => state.feedback.metrics);

  return (
    <section>
      <Title>
        <h2>Summary</h2>
        <WeekDiv>for week of {moment().format('MMMM Do')}</WeekDiv>
      </Title>
      <hr style={{ marginTop: 0 }} />
      <Metrics
        metrics={[
          {
            id: 'feedback-count',
            name: 'Total feedback responses (#)',
            value: metrics.feedbackCount,
            mom: metrics.momCountPercent,
          },
          {
            id: 'feedback-avg-rating',
            name: 'Average feedback rating',
            value: toDisplayRating(metrics.averageRating),
            mom: metrics.momAvgRatingPercent ? parseFloat(Number(metrics.momAvgRatingPercent).toFixed(1)) : null,
          },
          {
            id: 'feedback-lowest-rating',
            name: 'Lowest feedback rating ',
            value: toDisplayRating(metrics.lowestSiteAverageRating),
            mom: metrics.momLowestRatingPercent ? parseFloat(Number(metrics.momLowestRatingPercent).toFixed(1)) : null,
          },
        ]}
      />
      <hr />
    </section>
  );
};
