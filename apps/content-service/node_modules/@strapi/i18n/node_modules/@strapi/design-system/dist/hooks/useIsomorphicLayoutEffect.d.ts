import { useEffect } from 'react';
export declare const isSSR: () => boolean;
/**
 * Use this to read layout from the DOM and synchronously
 * re-render if the isSSR returns true. Updates scheduled
 * inside `useIsomorphicLayoutEffect` will be flushed
 * synchronously in the browser, before the browser has
 * a chance to paint.
 */
declare const useIsomorphicLayoutEffect: typeof useEffect;
export { useIsomorphicLayoutEffect };
//# sourceMappingURL=useIsomorphicLayoutEffect.d.ts.map