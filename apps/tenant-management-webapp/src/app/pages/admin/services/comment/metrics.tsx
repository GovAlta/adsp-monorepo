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

export const CommentMetrics: FunctionComponent = () => {
  const metrics = useSelector((state: RootState) => state.comment.metrics);

  return (
    <section>
      <Title>
        <NoPaddingH2>Comment information</NoPaddingH2>
        <p>for week of {moment().format('MMMM Do')}</p>
      </Title>
      <Metrics
        metrics={[
          { id: 'topics-created', name: 'Topics created', value: metrics.topicsCreated },
          { id: 'comments-created', name: 'Comments posted', value: metrics.commentsCreated },
        ]}
      />
    </section>
  );
};
