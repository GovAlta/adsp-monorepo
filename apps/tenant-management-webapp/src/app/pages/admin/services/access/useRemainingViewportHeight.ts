import { RefObject, useLayoutEffect, useState } from 'react';
import useWindowDimensions from '@lib/useWindowDimensions';

/**
 * Returns the height from the element's top edge to the bottom of the window, less a gap, so the element can
 * fill the rest of the screen. Re-measured whenever the window is resized.
 */
export function useRemainingViewportHeight(ref: RefObject<HTMLElement>, bottomGapPx: number): number | undefined {
  const { width, height } = useWindowDimensions();
  const [remainingHeight, setRemainingHeight] = useState<number>();

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    const top = ref.current.getBoundingClientRect().top + window.scrollY;
    setRemainingHeight(Math.floor(height - top - bottomGapPx));
  }, [ref, width, height, bottomGapPx]);

  return remainingHeight;
}
