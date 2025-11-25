import * as React from 'react';
/**
 * TODO: realistically a lot of this logic is isolated to the `core/admin` package.
 * However, we want to expose the `useAutoReloadOverlayBlocker` hook to the plugins.
 *
 * Therefore, in V5 we should move this logic back to the `core/admin` package & export
 * the hook from that package and re-export here. For now, let's keep it all together
 * because it's easier to diagnose and we're not using a million refs because we don't
 * understand what's going on.
 */
export interface AutoReloadOverlayBlockerConfig {
    title?: string;
    description?: string;
    icon?: 'reload' | 'time';
}
export interface AutoReloadOverlayBlockerContextValue {
    lockAppWithAutoreload: (config?: AutoReloadOverlayBlockerConfig) => void;
    unlockAppWithAutoreload: () => void;
}
export interface AutoReloadOverlayBlockerProviderProps {
    children: React.ReactNode;
}
declare const AutoReloadOverlayBlockerProvider: ({ children }: AutoReloadOverlayBlockerProviderProps) => import("react/jsx-runtime").JSX.Element;
declare const useAutoReloadOverlayBlocker: () => AutoReloadOverlayBlockerContextValue;
export { AutoReloadOverlayBlockerProvider, useAutoReloadOverlayBlocker };
