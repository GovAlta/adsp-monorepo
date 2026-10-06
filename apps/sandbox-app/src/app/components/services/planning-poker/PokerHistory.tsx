import React from 'react';
import styled from 'styled-components';
import { GoabText } from '@abgov/react-components';
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
    <section aria-label="Estimated stories">
      <GoabText tag="h3" size="heading-xs" mt="none" mb="xs">
        Estimated stories
      </GoabText>
      <HistoryList data-testid="poker-history">
        {history.map((round) => (
          <li key={round.roundId}>
            <StoryTitle>
              {isSafeStoryUrl(round.storyUrl) ? (
                <a href={round.storyUrl} target="_blank" rel="noreferrer">
                  {round.storyTitle}
                </a>
              ) : (
                round.storyTitle
              )}
            </StoryTitle>
            <RoundResult>{describeRoundResult(round)}</RoundResult>
          </li>
        ))}
      </HistoryList>
    </section>
  );
};

const HistoryList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 24rem;
  overflow-y: auto;

  li {
    padding: var(--goa-space-xs) 0;
    border-bottom: 1px solid var(--goa-color-greyscale-200);
  }
`;

const StoryTitle = styled.div`
  font: var(--goa-typography-body-s);
  overflow-wrap: anywhere;
`;

const RoundResult = styled.div`
  font: var(--goa-typography-body-xs);
  color: var(--goa-color-text-secondary);
`;
