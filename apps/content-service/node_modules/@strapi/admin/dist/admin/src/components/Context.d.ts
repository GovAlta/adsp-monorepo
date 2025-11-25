import * as React from 'react';
/**
 * @experimental
 * @description Create a context provider and a hook to consume the context.
 *
 * @warning this may be removed to the design-system instead of becoming stable.
 */
declare function createContext<ContextValueType extends object | null>(rootComponentName: string, defaultContext?: ContextValueType): readonly [{
    (props: ContextValueType & {
        children: React.ReactNode;
    }): import("react/jsx-runtime").JSX.Element;
    displayName: string;
}, <Selected, ShouldThrow extends boolean = true>(consumerName: string, selector: (value: ContextValueType) => Selected, shouldThrowOnMissingContext?: ShouldThrow) => ShouldThrow extends true ? Selected : Selected | undefined];
export { createContext };
