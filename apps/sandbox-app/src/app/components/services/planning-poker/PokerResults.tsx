import React from 'react';
import styled from 'styled-components';
import { GoabCallout } from '@abgov/react-components';
import { PokerRound, PokerVote } from '../../../state';
import { countVotesByCard, describeRoundResult, formatCard } from './pokerUtils';

interface PokerResultsProps {
  round: PokerRound;
  votes: Record<string, PokerVote>;
}

export const PokerResults = ({ round, votes }: PokerResultsProps) => {
  const counts = countVotesByCard(votes);

  return (
    <GoabCallout
      type={round.consensus ? 'success' : 'information'}
      size="medium"
      heading={describeRoundResult(round)}
      testId="poker-results"
      ariaLive="polite"
      mt="m"
      mb="none"
    >
      {round.consensus ? 'Everyone agreed.' : 'Discuss the highest and lowest votes, then re-vote if needed.'}
      {counts.length > 0 && (
        <VoteCounts aria-label="Votes per card">
          {counts.map(({ card, count }) => (
            <li key={card}>
              <strong>{formatCard(card)}</strong> × {count}
            </li>
          ))}
        </VoteCounts>
      )}
    </GoabCallout>
  );
};

const VoteCounts = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: var(--goa-space-xs);
  list-style: none;
  margin: var(--goa-space-s) 0 0;
  padding: 0;

  li {
    padding: var(--goa-space-2xs) var(--goa-space-s);
    border: 1px solid var(--goa-color-greyscale-400);
    border-radius: var(--goa-border-radius-m);
    background: var(--goa-color-greyscale-white);
  }
`;
