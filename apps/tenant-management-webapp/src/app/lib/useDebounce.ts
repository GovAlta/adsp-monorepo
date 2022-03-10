import { useState, useEffect } from 'react';

type DebounceValueType = string | boolean | number | Record<string, any>;

/**
 * A helper util to return a value at a certain delay. The delay is reset if the value arg changes
 * @param value value to be returned after a period of delay
 * @param delay time in ms to apply the delay
 * @returns value after the delay timer
 */
export function useDebounce(value: DebounceValueType, delay: number): DebounceValueType {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    // Cancel the timeout if value changes (also on delay change or unmount)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
