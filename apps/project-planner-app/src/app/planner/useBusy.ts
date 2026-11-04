import { useCallback, useState } from 'react';

export type RunBusy = (action: () => Promise<void>) => Promise<void>;

/** Tracks whether an action is running. Failures are swallowed because the planner api already notifies the user. */
export const useBusy = (): [boolean, RunBusy] => {
  const [busy, setBusy] = useState(false);
  const run = useCallback<RunBusy>(async (action) => {
    setBusy(true);
    try {
      await action();
    } catch {
      // The api reports the error to the user.
    } finally {
      setBusy(false);
    }
  }, []);
  return [busy, run];
};
