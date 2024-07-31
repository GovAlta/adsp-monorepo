import React, { FunctionComponent } from 'react';
import moment from 'moment';
import { Metrics } from '@components/Metrics';
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
        <NoPaddingH2>Feedback information</NoPaddingH2>
        <p>for week of {moment().format('MMMM Do')}</p>
      </Title>
      <Metrics
        metrics={[
          { id: 'feedback-count', name: 'Feedback submitted (#)', value: metrics.feedbackCount },
          { id: 'feedback-avg-rating', name: 'Average rating', value: metrics.averageRating },
          { id: 'feedback-count', name: 'Lowest site rating', value: metrics.lowestSiteAverageRating },
        ]}
      />
    </section>
  );
};
