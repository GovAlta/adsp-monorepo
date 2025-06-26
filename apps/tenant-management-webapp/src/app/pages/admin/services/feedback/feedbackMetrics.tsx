import { GridItem } from '@core-services/app-common';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { GoABlock } from '@abgov/react-components';
import difficultSvgDefault from '@assets/Difficult-Default.svg';
import veryDifficultSvgDefault from '@assets/Very_Difficult-Default.svg';
import neutralSvgDefault from '@assets/Neutral-Default.svg';
import easySvgDefault from '@assets/Easy-Default.svg';
import veryEasySvgDefault from '@assets/Very_Easy-Default.svg';
import greenArrow from '@assets/green-arrow.svg';
import redArrow from '@assets/red-arrow.svg';

interface Metric {
  id: string;
  name: string;
  value?: number;
  mom?: number | null; // Month over month change percentage
}

interface MetricsProps {
  metrics: Metric[];
}
const ratings = [
  {
    label: 'Very Difficult',
    value: 1,
    svgDefault: veryDifficultSvgDefault,
  },
  {
    label: 'Difficult',
    value: 2,
    svgDefault: difficultSvgDefault,
  },
  {
    label: 'Neutral',
    value: 3,
    svgDefault: neutralSvgDefault,
  },
  {
    label: 'Easy',
    value: 4,
    svgDefault: easySvgDefault,
  },
  {
    label: 'Very Easy',
    value: 5,
    svgDefault: veryEasySvgDefault,
  },
];

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
    line-height: 1.5rem;
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
    <GoABlock gap="s" direction="row">
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
                    src={mom > 0 ? greenArrow : redArrow}
                    alt={mom > 0 ? 'Up' : 'Down'}
                    style={{ width: '18px', height: '18px', marginRight: '4px' }}
                  />
                  <span> {`${Math.abs(mom)} MoM`}%</span>
                </>
              )}
            </MomDiv>
          </MetricGridItem>
        );
      })}
    </GoABlock>
  );
};
