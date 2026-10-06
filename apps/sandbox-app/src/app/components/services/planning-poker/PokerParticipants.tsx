import React from 'react';
import styled, { css } from 'styled-components';
import { GoabText } from '@abgov/react-components';
import { ParticipantRow, formatCard } from './pokerUtils';

interface PokerParticipantsProps {
  rows: ParticipantRow[];
  revealed: boolean;
  myUserId: string | null;
}

const describeSeat = (row: ParticipantRow, revealed: boolean): string => {
  if (revealed) {
    return row.vote ? `${row.userName} voted ${formatCard(row.vote)}` : `${row.userName} did not vote`;
  }
  return row.hasVoted ? `${row.userName} has voted` : `${row.userName} is still thinking`;
};

const seatTestId = (row: ParticipantRow, flipped: boolean): string | undefined => {
  if (flipped) {
    return `poker-vote-${row.userId}`;
  }
  return row.hasVoted ? `poker-voted-${row.userId}` : undefined;
};

// Players without a vote show an empty slot: still thinking while voting, a dash once revealed.
const emptySlotMark = (revealed: boolean) => (revealed ? '–' : '…');

const SeatCard = ({ row, revealed }: { row: ParticipantRow; revealed: boolean }) => {
  const flipped = revealed && !!row.vote;

  return (
    <FlipCard $flipped={flipped} data-testid={seatTestId(row, flipped)} aria-hidden="true">
      <CardBack $voted={row.hasVoted}>{!row.hasVoted && emptySlotMark(revealed)}</CardBack>
      <CardFront>{flipped && formatCard(row.vote)}</CardFront>
    </FlipCard>
  );
};

export const PokerParticipants = ({ rows, revealed, myUserId }: PokerParticipantsProps) => {
  if (rows.length === 0) {
    return (
      <div data-testid="poker-no-participants">
        <GoabText size="body-s">No one is at the table yet. Share the session link with your team.</GoabText>
      </div>
    );
  }

  return (
    <Seats aria-label="Players at the table">
      {rows.map((row) => (
        <Seat key={row.userId} aria-label={describeSeat(row, revealed)}>
          <SeatCard row={row} revealed={revealed} />
          <SeatName title={row.userName}>
            {row.userName}
            {row.userId === myUserId && <You> (you)</You>}
          </SeatName>
        </Seat>
      ))}
    </Seats>
  );
};

const Seats = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
  gap: var(--goa-space-m);
  list-style: none;
  margin: 0;
  padding: var(--goa-space-m);
  border-radius: var(--goa-border-radius-l);
  background: var(--goa-color-greyscale-100);
`;

const Seat = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--goa-space-xs);
  min-width: 0;
`;

const SeatName = styled.span`
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: var(--goa-typography-body-s);
`;

const You = styled.span`
  color: var(--goa-color-text-secondary);
`;

const cardFace = css`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--goa-border-radius-m);
  backface-visibility: hidden;
  font: var(--goa-typography-heading-m);
`;

const FlipCard = styled.div<{ $flipped: boolean }>`
  position: relative;
  width: 3.5rem;
  height: 5rem;
  transform-style: preserve-3d;
  transition: transform 0.5s ease-in-out;
  transform: ${({ $flipped }) => ($flipped ? 'rotateY(180deg)' : 'none')};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const CardBack = styled.div<{ $voted: boolean }>`
  ${cardFace}
  ${({ $voted }) =>
    $voted
      ? css`
          border: 2px solid var(--goa-color-interactive-default);
          background: repeating-linear-gradient(
            45deg,
            var(--goa-color-interactive-default) 0 6px,
            var(--goa-color-interactive-hover) 6px 12px
          );
        `
      : css`
          border: 2px dashed var(--goa-color-greyscale-400);
          background: var(--goa-color-greyscale-white);
          color: var(--goa-color-greyscale-600);
        `}
`;

const CardFront = styled.div`
  ${cardFace}
  transform: rotateY(180deg);
  border: 2px solid var(--goa-color-interactive-default);
  background: var(--goa-color-greyscale-white);
  color: var(--goa-color-interactive-default);
`;
