import { useEffect, useRef, RefObject, useCallback } from 'react';

interface UseAutoScrollOptions {
  /**
   * Distance in pixels from bottom to consider user as having scrolled up
   * @default 50
   */
  threshold?: number;
  /**
   * Delay in milliseconds before triggering auto-scroll
   * @default 50
   */
  delay?: number;
}

interface UseAutoScrollReturn {
  /** Ref to attach to the scrollable container */
  scrollContainerRef: RefObject<HTMLDivElement>;
  /** Ref to attach to the element to scroll into view */
  targetElementRef: RefObject<HTMLDivElement>;
  /** Handler to attach to onScroll event of the scroll container */
  onScroll: () => void;
  /** Handler to manually reset the scroll state (e.g., after sending a message) */
  resetScroll: () => void;
}

/**
 * Hook that manages auto-scrolling to a target element while respecting user manual scrolling.
 * 
 * When the user manually scrolls up, auto-scrolling is disabled. When they send a message
 * (or call resetScroll), auto-scrolling is re-enabled for new content.
 * 
 * @param dependency - Dependency array to trigger auto-scroll (typically a messages array)
 * @param options - Configuration options
 * @returns Object with refs, scroll handler, and reset function
 * 
 * @example
 * const { scrollContainerRef, targetElementRef, onScroll, resetScroll } = useAutoScroll([messages]);
 * 
 * const handleSend = () => {
 *   // ... send logic
 *   resetScroll();
 * };
 * 
 * return (
 *   <div ref={scrollContainerRef} onScroll={onScroll}>
 *     {messages.map(msg => <div key={msg.id}>{msg.text}</div>)}
 *     <div ref={targetElementRef} />
 *   </div>
 * );
 */
export const useAutoScroll = (
  dependency: unknown[],
  options: UseAutoScrollOptions = {},
): UseAutoScrollReturn => {
  const { threshold = 50, delay = 50 } = options;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const targetElementRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  const onScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollHeight, scrollTop, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // If user scrolled more than threshold from bottom, mark that they've scrolled
    userScrolledRef.current = distanceFromBottom > threshold;
  }, [threshold]);

  const resetScroll = useCallback(() => {
    userScrolledRef.current = false;
  }, []);

  // Auto-scroll to target element only if user hasn't scrolled up
  useEffect(() => {
    if (userScrolledRef.current) return; // Skip if user has scrolled up

    const timer = setTimeout(() => {
      targetElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, delay);
    return () => clearTimeout(timer);
  }, dependency);

  return {
    scrollContainerRef,
    targetElementRef,
    onScroll,
    resetScroll,
  };
};
