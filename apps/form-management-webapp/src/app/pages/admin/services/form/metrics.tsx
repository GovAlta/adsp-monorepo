import { NoPaddingH2 } from '@components/AppHeader';
import { Metrics } from '@components/Metrics';
import { RootState } from '@store/index';
import moment from 'moment';
import React, { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

export const FormMetrics: FunctionComponent = () => {
  const metrics = useSelector((state: RootState) => state.form.metrics);

  return (
    <section>
      <Title>
        <NoPaddingH2>Form information</NoPaddingH2>
        <p>for week of {moment().format('MMMM Do')}</p>
      </Title>
      <Metrics
        metrics={[
          { id: 'forms-created', name: 'Drafts created', value: metrics.formsCreated },
          { id: 'forms-submitted', name: 'Forms submitted', value: metrics.formsSubmitted },
        ]}
      />
    </section>
  );
};
