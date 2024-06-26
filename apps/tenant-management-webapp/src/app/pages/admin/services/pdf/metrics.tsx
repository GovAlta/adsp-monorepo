import React from 'react';
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

export const PdfMetrics = (): JSX.Element => {
  const metrics = useSelector((state: RootState) => state.pdf?.metrics);

  return (
    <section>
      <Title>
        <NoPaddingH2>PDF information</NoPaddingH2>
        <p>for week of {moment().format('MMMM Do')}</p>
      </Title>
      <Metrics
        metrics={[
          { id: 'pdf-generated', name: 'PDFs generated', value: metrics?.pdfGenerated },
          { id: 'pdf-failed', name: 'PDFs failed', value: metrics?.pdfFailed },
          { id: 'pdf-avg-duration', name: 'Average time to generate (secs)', value: metrics?.generationDuration },
        ]}
      />
    </section>
  );
};
