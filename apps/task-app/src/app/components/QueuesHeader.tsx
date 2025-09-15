import { GoADivider } from '@abgov/react-components';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

interface QueuesHeaderProps {
  className?: string;
}

const QueuesHeaderComponent: FunctionComponent<QueuesHeaderProps> = ({ className }) => {
  return (
    <React.Fragment>
      <div className={className}>
        <span>Queues</span>
      </div>
      <GoADivider />
    </React.Fragment>
  );
};

export const QueuesHeader = styled(QueuesHeaderComponent)`
  height: 55px;
  background: white;
  z-index: 1;
  flex-grow: 0;
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  > span {
    margin: auto 14px auto 0;
  }

  > span:first-child {
    margin-left: var(--goa-space-3xl);
    margin-right: auto;
  }
`;
