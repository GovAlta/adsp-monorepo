import * as React from 'react';
interface UseIntersectionOptions {
    selectorToWatch: string;
    skipWhen?: boolean;
}
/**
 * TODO: refactor this before v2 stable.
 */
export declare const useIntersection: (scrollableAreaRef: React.MutableRefObject<HTMLElement | null>, callback: (entry: IntersectionObserverEntry) => void, { selectorToWatch, skipWhen }: UseIntersectionOptions) => void;
export {};
//# sourceMappingURL=useIntersection.d.ts.map