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

// Someone can vote before their join is recorded, so voters are included even if not in participants.
// The participant entry carries the latest nickname, so it wins over the name recorded with a vote.
export function buildParticipantRows(
  participants: Record<string, PokerParticipant>,
  votes: Record<string, PokerVote>,
): ParticipantRow[] {
  const userIds = new Set([...Object.keys(participants), ...Object.keys(votes)]);
  return [...userIds]
    .map((userId) => ({
      userId,
      userName: participants[userId]?.userName || votes[userId]?.userName || 'Unknown',
      hasVoted: !!votes[userId],
      vote: votes[userId]?.vote,
    }))
    .sort((a, b) => a.userName.localeCompare(b.userName));
}
