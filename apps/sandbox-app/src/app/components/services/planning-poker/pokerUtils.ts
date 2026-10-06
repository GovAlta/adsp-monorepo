import { POKER_DECK, PokerParticipant, PokerRound, PokerVote } from '../../../state';

export interface CardCount {
  card: string;
  count: number;
}

export interface ParticipantRow {
  userId: string;
  userName: string;
  hasVoted: boolean;
  vote?: string;
}

const SESSION_ID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const HTTP_URL_PATTERN = /^https?:\/\//i;
const NICKNAME_STORAGE_KEY = 'planning-poker-nickname';
const MAX_LISTED_NAMES = 3;
export const AUTO_REVEAL_DELAY_MS = 1000;
// Other boards only reveal if the chosen board has not, e.g. because it has not seen the last vote yet.
export const AUTO_REVEAL_FALLBACK_DELAY_MS = 5000;

export function formatCard(card: string): string {
  return card === 'coffee' ? '☕' : card;
}

export function buildSessionPath(tenantName: string, sessionId: string): string {
  return `/${tenantName}/services/planning-poker/${sessionId}`;
}

// Story links are typed by a participant; only http(s) links are rendered so a javascript: URL cannot run.
export function isSafeStoryUrl(url: string): boolean {
  return HTTP_URL_PATTERN.test(url || '');
}

export function describeRoundResult(round: PokerRound): string {
  const average = round.hasAverage ? `Average ${round.average}` : 'No numeric votes';
  return round.consensus ? `${average} · Consensus` : average;
}

// Accepts either a bare session ID or a full session link pasted by a teammate.
export function extractSessionId(input: string): string | null {
  return input?.match(SESSION_ID_PATTERN)?.[0].toLowerCase() || null;
}

// Browser storage can be unavailable (private windows, blocked site data); the nickname then lasts for this visit only.
export function loadSavedNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveNickname(nickname: string): void {
  try {
    if (nickname.trim()) {
      localStorage.setItem(NICKNAME_STORAGE_KEY, nickname.trim());
    } else {
      localStorage.removeItem(NICKNAME_STORAGE_KEY);
    }
  } catch {
    // See loadSavedNickname: without storage the nickname still applies to the current session.
  }
}

// Counts revealed votes per card, in deck order, skipping cards nobody picked.
export function countVotesByCard(votes: Record<string, PokerVote>): CardCount[] {
  const counts = Object.values(votes).reduce<Record<string, number>>((result, { vote }) => {
    if (vote) {
      result[vote] = (result[vote] || 0) + 1;
    }
    return result;
  }, {});
  return POKER_DECK.filter((card) => counts[card]).map((card) => ({ card, count: counts[card] }));
}

// Only players at the table get a seat; votes from players who dropped are ignored.
export function buildParticipantRows(
  participants: Record<string, PokerParticipant>,
  votes: Record<string, PokerVote>,
): ParticipantRow[] {
  return Object.entries(participants)
    .map(([userId, { userName }]) => ({
      userId,
      userName,
      hasVoted: !!votes[userId],
      vote: votes[userId]?.vote,
    }))
    .sort((a, b) => a.userName.localeCompare(b.userName));
}

export function hasEveryoneVoted(round: PokerRound | null, rows: ParticipantRow[]): boolean {
  return round?.status === 'voting' && rows.length > 0 && rows.every(({ hasVoted }) => hasVoted);
}

export function describeVotingProgress(rows: ParticipantRow[]): string {
  const waiting = rows.filter(({ hasVoted }) => !hasVoted).map(({ userName }) => userName);
  if (rows.length === 0) {
    return 'Waiting for players to join.';
  }
  if (waiting.length === 0) {
    return 'Everyone has voted. Revealing the cards…';
  }
  const listed = waiting.slice(0, MAX_LISTED_NAMES).join(', ');
  const more = waiting.length > MAX_LISTED_NAMES ? ` and ${waiting.length - MAX_LISTED_NAMES} more` : '';
  return `${rows.length - waiting.length} of ${rows.length} voted · waiting for ${listed}${more}`;
}

// Every board computes the same revealer (lowest user ID), so usually only one reveal call is made.
export function getAutoRevealDelay(rows: ParticipantRow[], myUserId: string | null): number {
  const [revealerId] = rows.map(({ userId }) => userId).sort();
  return revealerId === myUserId ? AUTO_REVEAL_DELAY_MS : AUTO_REVEAL_FALLBACK_DELAY_MS;
}
