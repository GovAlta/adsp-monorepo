import React from 'react';
import styled from 'styled-components';
import { GoabButton, GoabText } from '@abgov/react-components';
import { ParticipantRow, describeVotingProgress } from './pokerUtils';

interface PokerRoundStatusProps {
  rows: ParticipantRow[];
  revealing: boolean;
  onReveal: () => void;
}

export const PokerRoundStatus = ({ rows, revealing, onReveal }: PokerRoundStatusProps) => (
  <StatusRow>
    <div data-testid="poker-round-status" aria-live="polite">
      <GoabText size="body-s" mt="none" mb="none">
        {describeVotingProgress(rows)}
      </GoabText>
    </div>
    <GoabButton type="tertiary" size="compact" disabled={revealing} testId="poker-reveal" onClick={onReveal}>
      Reveal now
    </GoabButton>
  </StatusRow>
);

const StatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-s);
  margin-top: var(--goa-space-s);
`;
