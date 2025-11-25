import * as React from 'react';
/**
 * Hook that returns a ref to an element and a boolean indicating if the element is in the viewport
 * or in the element specified in `options.root`.
 */
declare const useElementOnScreen: <TElement extends HTMLElement = HTMLElement>(onVisiblityChange: (isVisible: boolean) => void, options?: IntersectionObserverInit) => React.RefObject<TElement>;
export { useElementOnScreen };
