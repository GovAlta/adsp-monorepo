import { ComponentType } from 'react';
type LazyComponentStore = Record<string, ComponentType | undefined>;
interface UseLazyComponentsReturn {
    isLazyLoading: boolean;
    lazyComponentStore: LazyComponentStore;
    cleanup: () => void;
}
/**
 * @description A hook to lazy load custom field components
 */
declare const useLazyComponents: (componentUids?: string[]) => UseLazyComponentsReturn;
export { useLazyComponents };
export type { UseLazyComponentsReturn, LazyComponentStore };
