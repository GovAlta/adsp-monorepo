import * as React from 'react';
import { LinkProps } from '@strapi/design-system';
import { type To } from 'react-router-dom';
interface HistoryState {
    /**
     * The history of the user's navigation within our application
     * during their current session.
     */
    history: string[];
    /**
     * The index of the current location in the history array.
     */
    currentLocationIndex: number;
    /**
     * The current location of the user within our application.
     */
    currentLocation: string;
    /**
     * Whether the user can go back in the history.
     */
    canGoBack: boolean;
}
interface HistoryContextValue extends HistoryState {
    /**
     * @description Push a new state to the history. You can
     * either pass a string or an object.
     */
    pushState: (path: {
        to: string;
        search: string;
    } | string) => void;
    /**
     * @description Go back in the history. This calls `navigate(-1)` internally
     * to keep the browser in sync with the application state.
     */
    goBack: () => void;
}
declare const useHistory: <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: HistoryContextValue) => Selected, shouldThrowOnMissingContext?: ShouldThrow | undefined) => ShouldThrow extends true ? Selected : Selected | undefined;
interface HistoryProviderProps {
    children: React.ReactNode;
}
declare const HistoryProvider: ({ children }: HistoryProviderProps) => import("react/jsx-runtime").JSX.Element;
interface BackButtonProps extends Pick<LinkProps, 'disabled'> {
    fallback?: To;
}
/**
 * @beta
 * @description The universal back button for the Strapi application. This uses the internal history
 * context to navigate the user back to the previous location. It can be completely disabled in a
 * specific user case. When no history is available, you can provide a fallback destination,
 * otherwise the link will be disabled.
 */
declare const BackButton: React.ForwardRefExoticComponent<BackButtonProps & React.RefAttributes<HTMLAnchorElement>>;
export { BackButton, HistoryProvider, useHistory };
export type { BackButtonProps, HistoryProviderProps, HistoryContextValue, HistoryState };
