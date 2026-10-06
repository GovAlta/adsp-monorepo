import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom-v7';
import styled from 'styled-components';
import { GoabBadge, GoabButton, GoabContainer, GoabText } from '@abgov/react-components';
import {
  AppDispatch,
  authenticatedUserSelector,
  castPokerVote,
  connectPokerStream,
  disconnectPokerStream,
  joinPokerSession,
  pokerActions,
  pokerSelector,
  pokerUserIdSelector,
  PokerRound,
  revealPokerVotes,
  setPokerNickname,
  startPokerRound,
} from '../../../state';
import { ServiceContainer } from '../../styled-components';
import { PokerCardDeck } from './PokerCardDeck';
import { PokerNickname } from './PokerNickname';
import { PokerRoundControls } from './PokerRoundControls';
import { PokerRoundStatus } from './PokerRoundStatus';
import { PokerHistory } from './PokerHistory';
import { PokerParticipants } from './PokerParticipants';
import { PokerResults } from './PokerResults';
import { usePokerPresence } from './usePokerPresence';
import {
  buildParticipantRows,
  buildSessionPath,
  getAutoRevealDelay,
  hasEveryoneVoted,
  isSafeStoryUrl,
  loadSavedNickname,
  saveNickname,
} from './pokerUtils';

const RoundHeading = ({ round }: { round: PokerRound | null }) => {
  if (!round) {
    return (
      <div data-testid="poker-waiting">
        <GoabText size="body-m" mt="none" mb="s">
          Waiting for someone to start a round.
        </GoabText>
      </div>
    );
  }

  return (
    <div data-testid="poker-story">
      <GoabText tag="h3" size="heading-s" mt="none" mb="s">
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
    <section aria-label="Invite your team">
      <GoabText tag="h3" size="heading-xs" mt="none" mb="xs">
        Invite your team
      </GoabText>
      <SessionLinkRow>
        <code data-testid="poker-session-link" title={link}>
          {link}
        </code>
        <GoabButton
          type="secondary"
          size="compact"
          leadingIcon={copied ? 'checkmark' : 'copy'}
          testId="poker-copy-link"
          onClick={copyLink}
        >
          {copied ? 'Copied' : 'Copy'}
        </GoabButton>
      </SessionLinkRow>
    </section>
  );
};

export const PlanningPokerBoard = () => {
  const { tenant: tenantName, sessionId } = useParams<{ tenant: string; sessionId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(authenticatedUserSelector);
  const myUserId = useSelector(pokerUserIdSelector);
  const { round, votes, participants, history, myVote, nickname, connected, busy } = useSelector(pokerSelector);
  const isVoting = round?.status === 'voting';
  const isRevealed = round?.status === 'revealed';
  const rows = useMemo(() => buildParticipantRows(participants, votes), [participants, votes]);
  const autoRevealDelay = hasEveryoneVoted(round, rows) ? getAutoRevealDelay(rows, myUserId) : null;

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

  usePokerPresence(sessionId);

  // Restarts when a new round starts, so each round is revealed once everyone at the table has voted.
  useEffect(() => {
    if (autoRevealDelay === null) {
      return undefined;
    }
    const timer = setTimeout(() => dispatch(revealPokerVotes()), autoRevealDelay);
    return () => clearTimeout(timer);
  }, [dispatch, autoRevealDelay, round?.roundId]);

  return (
    <ServiceContainer>
      <GoabContainer
        accent="thick"
        type="non-interactive"
        padding="compact"
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
        <BoardLayout>
          <BoardMain>
            <PokerRoundControls
              round={round}
              starting={busy.starting}
              onStartRound={(storyTitle, storyUrl) => dispatch(startPokerRound({ storyTitle, storyUrl }))}
            />
            <PokerTable>
              <RoundHeading round={round} />
              <PokerParticipants rows={rows} revealed={isRevealed} myUserId={myUserId} />
              {isVoting && (
                <PokerRoundStatus
                  rows={rows}
                  revealing={busy.revealing}
                  onReveal={() => dispatch(revealPokerVotes())}
                />
              )}
              {isRevealed && <PokerResults round={round} votes={votes} />}
            </PokerTable>
            <section aria-label="Your card">
              <GoabText tag="h3" size="heading-xs" mt="none" mb="none">
                Your card
              </GoabText>
              <PokerCardDeck
                selected={myVote}
                disabled={!isVoting || busy.voting}
                onSelect={(card) => dispatch(castPokerVote(card))}
              />
            </section>
          </BoardMain>
          <BoardAside>
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
            <PokerHistory history={history} />
          </BoardAside>
        </BoardLayout>
      </GoabContainer>
    </ServiceContainer>
  );
};

const BoardLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--goa-space-l);

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 1fr) 20rem;
  }
`;

const BoardMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-m);
  min-width: 0;
`;

const BoardAside = styled.aside`
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-l);
  min-width: 0;

  @media (min-width: 1024px) {
    padding-left: var(--goa-space-l);
    border-left: 1px solid var(--goa-color-greyscale-200);
  }
`;

const PokerTable = styled.section`
  padding: var(--goa-space-m);
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-l);
`;

const SessionLinkRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);

  code {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: var(--goa-typography-body-xs);
  }
`;
