import React from 'react';
import { GoabBadge, GoabTable, GoabText } from '@abgov/react-components';
import { ParticipantRow, formatCard } from './pokerUtils';

interface PokerParticipantsProps {
  rows: ParticipantRow[];
  revealed: boolean;
}

const VoteStatus = ({ row, revealed }: { row: ParticipantRow; revealed: boolean }) => {
  if (revealed && row.vote) {
    return <strong data-testid={`poker-vote-${row.userId}`}>{formatCard(row.vote)}</strong>;
  }
  return row.hasVoted ? (
    <GoabBadge type="success" content="Voted" icon={false} testId={`poker-voted-${row.userId}`} />
  ) : (
    <GoabBadge type="information" content="Thinking…" icon={false} emphasis="subtle" />
  );
};

export const PokerParticipants = ({ rows, revealed }: PokerParticipantsProps) => {
  if (rows.length === 0) {
    return (
      <div data-testid="poker-no-participants">
        <GoabText size="body-s">No one has joined yet. Share the session link with your team.</GoabText>
      </div>
    );
  }

  return (
    <GoabTable width="100%" mb="l">
      <thead>
        <tr>
          <th>Participant</th>
          <th>{revealed ? 'Vote' : 'Status'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.userId}>
            <td>{row.userName}</td>
            <td>
              <VoteStatus row={row} revealed={revealed} />
            </td>
          </tr>
        ))}
      </tbody>
    </GoabTable>
  );
};
