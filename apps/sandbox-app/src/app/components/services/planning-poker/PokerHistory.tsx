import React from 'react';
import { GoabTable } from '@abgov/react-components';
import { PokerRound } from '../../../state';
import { describeRoundResult, isSafeStoryUrl } from './pokerUtils';

interface PokerHistoryProps {
  history: PokerRound[];
}

export const PokerHistory = ({ history }: PokerHistoryProps) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <GoabTable width="100%" mb="l" testId="poker-history">
      <thead>
        <tr>
          <th>Story</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        {history.map((round) => (
          <tr key={round.roundId}>
            <td>
              {isSafeStoryUrl(round.storyUrl) ? (
                <a href={round.storyUrl} target="_blank" rel="noreferrer">
                  {round.storyTitle}
                </a>
              ) : (
                round.storyTitle
              )}
            </td>
            <td>{describeRoundResult(round)}</td>
          </tr>
        ))}
      </tbody>
    </GoabTable>
  );
};
