import React from 'react';
import { GoabCallout, GoabTable } from '@abgov/react-components';
import { PokerRound, PokerVote } from '../../../state';
import { countVotesByCard, describeRoundResult, formatCard } from './pokerUtils';

interface PokerResultsProps {
  round: PokerRound;
  votes: Record<string, PokerVote>;
}

export const PokerResults = ({ round, votes }: PokerResultsProps) => {
  const counts = countVotesByCard(votes);

  return (
    <>
      <GoabCallout
        type={round.consensus ? 'success' : 'information'}
        heading={describeRoundResult(round)}
        testId="poker-results"
        mb="m"
      >
        {round.consensus ? 'Everyone agreed.' : 'Discuss the highest and lowest votes, then re-vote if needed.'}
      </GoabCallout>
      {counts.length > 0 && (
        <GoabTable width="100%" mb="l">
          <thead>
            <tr>
              <th>Card</th>
              <th>Votes</th>
            </tr>
          </thead>
          <tbody>
            {counts.map(({ card, count }) => (
              <tr key={card}>
                <td>{formatCard(card)}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </GoabTable>
      )}
    </>
  );
};
