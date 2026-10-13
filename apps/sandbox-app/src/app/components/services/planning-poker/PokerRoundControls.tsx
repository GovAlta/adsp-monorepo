import React, { useState } from 'react';
import styled from 'styled-components';
import { GoabButton, GoabFormItem, GoabInput } from '@abgov/react-components';
import { PokerRound } from '../../../state';

interface PokerRoundControlsProps {
  round: PokerRound | null;
  starting: boolean;
  onStartRound: (storyTitle: string, storyUrl: string) => void;
}

export const PokerRoundControls = ({ round, starting, onStartRound }: PokerRoundControlsProps) => {
  const [storyTitle, setStoryTitle] = useState('');
  const [storyUrl, setStoryUrl] = useState('');
  const isVoting = round?.status === 'voting';
  const canStart = !!storyTitle.trim() && !starting;

  const startRound = () => {
    if (!canStart) {
      return;
    }
    onStartRound(storyTitle.trim(), storyUrl.trim());
    setStoryTitle('');
    setStoryUrl('');
  };

  const startOnEnter = ({ key }: { key: string }) => {
    if (key === 'Enter') {
      startRound();
    }
  };

  return (
    <StoryForm aria-label="Start a round">
      <TitleField>
        <GoabFormItem label="Story to estimate" labelSize="compact">
          <GoabInput
            name="storyTitle"
            value={storyTitle}
            size="compact"
            width="100%"
            maxLength={200}
            placeholder="ADSP-1234 Add draft submission endpoint"
            testId="poker-story-title"
            onChange={(detail) => setStoryTitle(detail.value)}
            onKeyPress={startOnEnter}
          />
        </GoabFormItem>
      </TitleField>
      <LinkField>
        <GoabFormItem label="Story link" labelSize="compact" requirement="optional">
          <GoabInput
            name="storyUrl"
            value={storyUrl}
            size="compact"
            width="100%"
            maxLength={500}
            placeholder="https://"
            testId="poker-story-url"
            onChange={(detail) => setStoryUrl(detail.value)}
            onKeyPress={startOnEnter}
          />
        </GoabFormItem>
      </LinkField>
      <GoabButton
        type={isVoting ? 'secondary' : 'primary'}
        size="compact"
        disabled={!canStart}
        testId="poker-start-round"
        onClick={startRound}
      >
        Start round
      </GoabButton>
    </StoryForm>
  );
};

const StoryForm = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--goa-space-s) var(--goa-space-m);
`;

const TitleField = styled.div`
  flex: 2 1 18rem;
  min-width: 0;
`;

const LinkField = styled.div`
  flex: 1 1 12rem;
  min-width: 0;
`;
