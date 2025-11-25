/**
 * @internal
 * @description Return a function that re-renders this component, if still mounted
 * @warning DO NOT USE EXCEPT SPECIAL CASES.
 */
declare const useForceUpdate: () => readonly [number | undefined, () => void];
export { useForceUpdate };
