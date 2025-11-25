import { IntlCache } from '@formatjs/intl';
import * as React from 'react';
import type { IntlConfig, IntlShape } from '../types';
interface State {
    /**
     * Explicit intl cache to prevent memory leaks
     */
    cache: IntlCache;
    /**
     * Intl object we created
     */
    intl?: IntlShape;
    /**
     * list of memoized config we care about.
     * This is important since creating intl is
     * very expensive
     */
    prevConfig: IntlConfig;
}
export default class IntlProvider extends React.PureComponent<React.PropsWithChildren<IntlConfig>, State> {
    static displayName: string;
    static defaultProps: Pick<import("../types").ResolvedIntlConfig, "timeZone" | "onError" | "fallbackOnEmptyString" | "formats" | "messages" | "defaultLocale" | "defaultFormats" | "textComponent">;
    private cache;
    state: State;
    static getDerivedStateFromProps(props: Readonly<IntlConfig>, { prevConfig, cache }: State): Partial<State> | null;
    render(): JSX.Element;
}
export {};
