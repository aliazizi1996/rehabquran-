import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce values (e.g. search queries)
 * Prevents continuous API / Firestore queries on every keystroke
 * @param value The input value to debounce
 * @param delay Delay in milliseconds (default 350ms)
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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
