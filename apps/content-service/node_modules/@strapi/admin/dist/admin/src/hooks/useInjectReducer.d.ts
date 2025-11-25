import { Reducer } from '@reduxjs/toolkit';
/**
 * @public
 * @description Inject a new reducer into the global redux-store.
 * @example
 * ```tsx
 * import { reducer } from './local-store';
 *
 * const MyPlugin = () => {
 *  useInjectReducer("plugin", reducer);
 * }
 * ```
 */
export declare function useInjectReducer(namespace: string, reducer: Reducer): void;
