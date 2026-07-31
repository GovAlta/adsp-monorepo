import { useCallback, useEffect, useRef, useState } from 'react';
import { isEqual } from 'lodash';
import { useDebounce } from './useDebounce';

export const COMMIT_DELAY = 300;

export interface SetValueOptions {
  /**
   * Whether the edit should be pushed upstream once typing stops. Pass false for a field whose
   * owner commits on its own schedule; the value is still mirrored and still protected from
   * incoming data until something calls flush.
   */
  autoCommit?: boolean;
}

export interface DebouncedCommit<T> {
  /** The live value to bind to the input; updated on every keystroke. */
  value: T;
  /** Records a keystroke and, unless told otherwise, schedules the commit. */
  setValue: (next: T, options?: SetValueOptions) => void;
  /** Commits straight away, for events that are not typing (blur, selecting a suggestion, unmount). */
  flush: () => void;
}

/**
 * Keeps a live, per-keystroke mirror of a control's value and pushes it into the form data only
 * once the user pauses typing.
 *
 * The GoA web components keep the value in their own DOM and report changes back a macrotask
 * late, while their update path writes an incoming `value` prop straight back into the field
 * whenever it differs from what is in the box. So a render that commits a value older than what
 * has been typed since wipes out the characters in between. Committing on every keystroke
 * re-renders and revalidates the whole form, which makes that window wide enough to swallow
 * characters; debouncing the commit keeps it to a single local render.
 *
 * The echo of our own commit is ignored while further edits are outstanding, so data arriving
 * back from the form can never overwrite what the user has typed in the meantime.
 *
 * @param externalValue the value held in the form data; must be referentially stable between
 *   renders (memoize it when it is an object), otherwise the sync effect runs on every render
 * @param commit pushes a settled value into the form data
 * @param delay how long to wait for typing to stop before committing
 */
export function useDebouncedCommit<T>(
  externalValue: T,
  commit: (value: T) => void,
  delay: number = COMMIT_DELAY,
): DebouncedCommit<T> {
  const [value, setLocalValue] = useState<T>(externalValue);

  // Set while the user has edits we have not pushed upstream yet.
  const pendingRef = useRef<T | null>(null);
  const autoCommitRef = useRef(true);

  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });

  const debouncedValue = useDebounce(value, delay);

  const flush = useCallback(() => {
    const pending = pendingRef.current;
    if (pending === null) {
      return;
    }

    pendingRef.current = null;
    autoCommitRef.current = true;
    commitRef.current(pending);
  }, []);

  const setValue = useCallback((next: T, options?: SetValueOptions) => {
    pendingRef.current = next;
    autoCommitRef.current = options?.autoCommit !== false;
    setLocalValue(next);
  }, []);

  useEffect(() => {
    if (!autoCommitRef.current) {
      return;
    }

    // Only commit once the debounce has caught up with the latest keystroke.
    if (pendingRef.current === null || pendingRef.current !== debouncedValue) {
      return;
    }

    flush();
  }, [debouncedValue, flush]);

  useEffect(() => {
    if (pendingRef.current !== null) {
      return;
    }

    setLocalValue((current) => (isEqual(current, externalValue) ? current : externalValue));
  }, [externalValue]);

  // Don't drop the tail of what was typed when the control goes away, e.g. on stepper navigation.
  useEffect(() => flush, [flush]);

  return { value, setValue, flush };
}
