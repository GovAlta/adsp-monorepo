import React, { useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabFormItem, GoabInput } from '@abgov/react-components';
import { PokerRound } from '../../../state';

interface PokerRoundControlsProps {
  round: PokerRound | null;
  starting: boolean;
  revealing: boolean;
  onStartRound: (storyTitle: string, storyUrl: string) => void;
  onReveal: () => void;
}

export const PokerRoundControls = ({ round, starting, revealing, onStartRound, onReveal }: PokerRoundControlsProps) => {
  const [storyTitle, setStoryTitle] = useState('');
  const [storyUrl, setStoryUrl] = useState('');
  const isVoting = round?.status === 'voting';

  const startRound = () => {
    onStartRound(storyTitle.trim(), storyUrl.trim());
    setStoryTitle('');
    setStoryUrl('');
  };

  return (
    <section aria-label="Round controls">
      <GoabFormItem label="Story to estimate" mb="s">
        <GoabInput
          name="storyTitle"
          value={storyTitle}
          width="100%"
          maxLength={200}
          placeholder="ADSP-1234 Add draft submission endpoint"
          testId="poker-story-title"
          onChange={(detail) => setStoryTitle(detail.value)}
        />
      </GoabFormItem>
      <GoabFormItem label="Story link" requirement="optional">
        <GoabInput
          name="storyUrl"
          value={storyUrl}
          width="100%"
          maxLength={500}
          testId="poker-story-url"
          onChange={(detail) => setStoryUrl(detail.value)}
        />
      </GoabFormItem>
      <GoabButtonGroup alignment="start" mt="m">
        <GoabButton
          type={isVoting ? 'secondary' : 'primary'}
          disabled={!storyTitle.trim() || starting}
          testId="poker-start-round"
          onClick={startRound}
        >
          Start round
        </GoabButton>
        <GoabButton disabled={!isVoting || revealing} testId="poker-reveal" onClick={onReveal}>
          Reveal votes
        </GoabButton>
      </GoabButtonGroup>
    </section>
  );
};
