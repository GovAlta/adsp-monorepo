import * as React from 'react';
/**
 * TODO: this isn't great, and we really should focus on fixing this.
 */
declare const PluginsInitializer: ({ children }: {
    children: React.ReactNode;
}) => string | number | boolean | Iterable<React.ReactNode> | import("react/jsx-runtime").JSX.Element | null | undefined;
export { PluginsInitializer };
