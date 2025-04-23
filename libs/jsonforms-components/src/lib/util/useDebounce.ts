import { useState, useEffect } from 'react';

//type DebounceValueType = string | boolean | number | Record<string, unknown>;

/**
 * A helper util to return a value at a certain delay. The delay is reset if the value arg changes
 * @param value value to be returned after a period of delay
 * @param delay time in ms to apply the delay
 * @returns value after the delay timer
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
