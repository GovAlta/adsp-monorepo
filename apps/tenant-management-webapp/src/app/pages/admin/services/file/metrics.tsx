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

export const FileMetrics: FunctionComponent = () => {
  const metrics = useSelector((state: RootState) => state.fileService.metrics);

  return (
    <section>
      <Title>
        <h2>File information</h2>
        <p>for week of {moment().format('MMMM Do')}</p>
      </Title>
      <Metrics
        metrics={[
          { id: 'file-uploaded', name: 'Files uploaded', value: metrics.filesUploaded },
          { id: 'file-lifetime-duration', name: 'Average lifetime (days)', value: metrics.fileLifetime },
        ]}
      />
    </section>
  );
};
