import { GridItem } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { GoabBlock } from '@abgov/react-components';
import greenArrow from '@assets/green-arrow.svg';
import redArrow from '@assets/red-arrow.svg';
import natural from '@assets/neutral-icon.svg';
import { ratings } from './ratings';
interface Metric {
  id: string;
  name: string;
  value?: number;
  mom?: number | null; // Month over month change percentage
}

interface MetricsProps {
  metrics: Metric[];
}

const MetricGridItem = styled(GridItem)`
  border: 1px solid #ccc;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  span {
    font-size: var(--fs-sm);
    color: var(--color-gray-900);
    opacity: 0.8;
    margin-top: 2px;
  }
  b {
    font-size: var(--fs-sm);
    line-height: 1.25rem;
  }
`;

const Count = styled.div`
  font-size: var(--fs-md);
  font-weight: var(--fw-bold);
  padding-bottom: 1rem;
`;
const MomDiv = styled.div`
  display: flex;
  align-items: center;
  min-width: 48px;
  justify-content: flex-end;
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
`;

export const Metrics: FunctionComponent<MetricsProps> = ({ metrics }: MetricsProps) => {
  return (
    <GoabBlock gap="s" direction="row">
      {metrics.map(({ id, name, value, mom }) => {
        const ratingInfo = value !== undefined ? ratings.find((r) => r.value === Math.round(value)) : undefined;

        return (
          <MetricGridItem key={id} md={4}>
            <b>{name}</b>
            <span>Per week</span>
            <Count id={id}>
              {id !== 'feedback-count' && value ? (
                <>
                  <img
                    src={ratingInfo?.svgDefault}
                    alt={ratingInfo?.label}
                    style={{ width: '16px', height: '16px', verticalAlign: 'middle', marginRight: '8px' }}
                  />
                  {`${ratingInfo?.value} - ${ratingInfo?.label}`}
                </>
              ) : (
                value?.toFixed() || '-'
              )}
            </Count>
            <MomDiv>
              {typeof mom === 'number' && (
                <>
                  <img
                    src={mom > 0 ? greenArrow : mom < 0 ? redArrow : natural}
                    alt={mom > 0 ? 'Up' : mom < 0 ? 'Down' : 'No change'}
                    style={{ width: '14px', height: '14px', marginRight: '4px' }}
                  />
                  <span> {`${Math.abs(mom)} MoM`}%</span>
                </>
              )}
            </MomDiv>
          </MetricGridItem>
        );
      })}
    </GoabBlock>
  );
};
