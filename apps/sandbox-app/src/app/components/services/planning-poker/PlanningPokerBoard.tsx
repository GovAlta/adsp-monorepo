import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-v7';
import styled from 'styled-components';
import { GoabBadge, GoabButton, GoabContainer, GoabDivider, GoabText } from '@abgov/react-components';
import {
  AppDispatch,
  authenticatedUserSelector,
  castPokerVote,
  connectPokerStream,
  disconnectPokerStream,
  joinPokerSession,
  pokerActions,
  pokerSelector,
  PokerRound,
  revealPokerVotes,
  setPokerNickname,
  startPokerRound,
} from '../../../state';
import { ServiceContainer } from '../../styled-components';
import { PokerCardDeck } from './PokerCardDeck';
import { PokerNickname } from './PokerNickname';
import { PokerRoundControls } from './PokerRoundControls';
import { PokerHistory } from './PokerHistory';
import { PokerParticipants } from './PokerParticipants';
import { PokerResults } from './PokerResults';
import { buildParticipantRows, buildSessionPath, isSafeStoryUrl, loadSavedNickname, saveNickname } from './pokerUtils';

const RoundHeading = ({ round }: { round: PokerRound | null }) => {
  if (!round) {
    return (
      <div data-testid="poker-waiting">
        <GoabText size="body-m">Waiting for someone to start a round.</GoabText>
      </div>
    );
  }

  return (
    <div data-testid="poker-story">
      <GoabText tag="h3" size="heading-s" mb="xs">
        {isSafeStoryUrl(round.storyUrl) ? (
          <a href={round.storyUrl} target="_blank" rel="noreferrer">
            {round.storyTitle}
          </a>
        ) : (
          round.storyTitle
        )}
      </GoabText>
    </div>
  );
};

const SessionLink = ({ link }: { link: string }) => {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard?.writeText(link);
    setCopied(true);
  };

  return (
    <SessionLinkRow>
      <GoabText size="body-s" mt="none" mb="none">
        Share this link with your team: <code data-testid="poker-session-link">{link}</code>
      </GoabText>
      <GoabButton type="tertiary" size="compact" testId="poker-copy-link" onClick={copyLink}>
        {copied ? 'Copied' : 'Copy link'}
      </GoabButton>
    </SessionLinkRow>
  );
};

export const PlanningPokerBoard = () => {
  const { tenant: tenantName, sessionId } = useParams<{ tenant: string; sessionId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(authenticatedUserSelector);
  const { round, votes, participants, history, myVote, nickname, connected, busy } = useSelector(pokerSelector);
  const isVoting = round?.status === 'voting';
  const isRevealed = round?.status === 'revealed';
  const rows = useMemo(() => buildParticipantRows(participants, votes), [participants, votes]);

  useEffect(() => {
    dispatch(pokerActions.sessionOpened(sessionId));
    // Restore before joining so the session sees the saved nickname straight away.
    dispatch(pokerActions.nicknameRestored(loadSavedNickname()));
    dispatch(joinPokerSession(sessionId));
    dispatch(connectPokerStream(sessionId));
    return () => {
      dispatch(disconnectPokerStream());
    };
  }, [dispatch, sessionId]);

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        width={'full'}
        testId={'planningPokerBoard'}
        heading={'Planning poker'}
        actions={
          <GoabBadge
            type={connected ? 'success' : 'important'}
            content={connected ? 'Live' : 'Connecting…'}
            icon={false}
            testId="poker-connection"
          />
        }
      >
        <SessionLink link={`${window.location.origin}${buildSessionPath(tenantName, sessionId)}`} />
        <PokerNickname
          nickname={nickname || ''}
          defaultName={user?.name || user?.email || 'your name'}
          saving={busy.renaming}
          onSave={(value) => {
            saveNickname(value);
            dispatch(setPokerNickname(value));
          }}
        />
        <GoabDivider mt="m" mb="m" />
        <PokerRoundControls
          round={round}
          starting={busy.starting}
          revealing={busy.revealing}
          onStartRound={(storyTitle, storyUrl) => dispatch(startPokerRound({ storyTitle, storyUrl }))}
          onReveal={() => dispatch(revealPokerVotes())}
        />
        <GoabDivider mt="m" mb="m" />
        <RoundHeading round={round} />
        <PokerCardDeck
          selected={myVote}
          disabled={!isVoting || busy.voting}
          onSelect={(card) => dispatch(castPokerVote(card))}
        />
        {isRevealed && <PokerResults round={round} votes={votes} />}
        <PokerParticipants rows={rows} revealed={isRevealed} />
        <PokerHistory history={history} />
      </GoabContainer>
    </ServiceContainer>
  );
};

const SessionLinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--goa-space-s);

  code {
    word-break: break-all;
  }
`;
