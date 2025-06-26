import React, { FunctionComponent } from 'react';
import moment from 'moment';
import { Metrics } from './feedbackMetrics';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { NoPaddingH2 } from '@components/AppHeader';

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

export const FeedbackMetrics: FunctionComponent = () => {
  const metrics = useSelector((state: RootState) => state.feedback.metrics);

  return (
    <section>
      <Title>
        <NoPaddingH2>Summary</NoPaddingH2>
        <p>for week of {moment().format('MMMM Do')}</p>
      </Title>
      <hr />
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
            value: metrics.averageRating ? metrics.averageRating + 1 : metrics.averageRating,
            mom: metrics.momAvgRatingPercent,
          },
          {
            id: 'feedback-lowest-rating',
            name: 'Lowest feedback rating ',
            value: metrics.lowestSiteAverageRating
              ? metrics.lowestSiteAverageRating + 1
              : metrics.lowestSiteAverageRating,
            mom: metrics.momLowestRatingPercent,
          },
        ]}
      />
      <hr />
    </section>
  );
};
