import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  AppDispatch,
  joinPokerSession,
  leavePokerSession,
  POKER_HEARTBEAT_INTERVAL_MS,
  pokerActions,
} from '../../../state';

const PRUNE_INTERVAL_MS = 10_000;

// Keeps me at the table with a heartbeat, drops players who went silent, and leaves when the board or tab closes.
export function usePokerPresence(sessionId: string) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const heartbeat = setInterval(() => dispatch(joinPokerSession(sessionId)), POKER_HEARTBEAT_INTERVAL_MS);
    const prune = setInterval(() => dispatch(pokerActions.participantsPruned(Date.now())), PRUNE_INTERVAL_MS);
    const leave = () => dispatch(leavePokerSession(sessionId));
    window.addEventListener('pagehide', leave);

    return () => {
      clearInterval(heartbeat);
      clearInterval(prune);
      window.removeEventListener('pagehide', leave);
      leave();
    };
  }, [dispatch, sessionId]);
}
