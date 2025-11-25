import * as React from 'react';
type PossibleRef<T> = React.Ref<T> | undefined;
/**
 * A utility to compose multiple refs together
 * Accepts callback refs and RefObject(s)
 */
declare function composeRefs<T>(...refs: PossibleRef<T>[]): (node: T) => void;
/**
 * Takes multiple React like refs either React.Ref or a callback:
 * (node: T) => void and returns a single function that can be
 * passed to a React component as a ref.
 *
 * Example:
 * ```tsx
 * import { useComposedRefs } from '../hooks/useComposedRefs';
 *
 * const Component = React.forwardRef<HTMLInputElement, ComponentProps>((props, forwardedRef) => {
 *  const ref = useComposedRefs(internalRef, forwardedRef);
 *
 *  React.useEffect(() => {
 *   ref.current.focus();
 *  }, [ref]);
 *
 *  return <input ref={ref} />
 * }
 * ```
 */
declare function useComposedRefs<T>(...refs: PossibleRef<T>[]): (node: T) => void;
export { composeRefs, useComposedRefs };
//# sourceMappingURL=useComposeRefs.d.ts.map