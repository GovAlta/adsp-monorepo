import { jsx } from 'react/jsx-runtime';
import * as React from 'react';
import * as ContextSelector from 'use-context-selector';

/**
 * @experimental
 * @description Create a context provider and a hook to consume the context.
 *
 * @warning this may be removed to the design-system instead of becoming stable.
 */ function createContext(rootComponentName, defaultContext) {
    const Context = ContextSelector.createContext(defaultContext);
    const Provider = (props)=>{
        const { children, ...context } = props;
        // Only re-memoize when prop values change
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const value = React.useMemo(()=>context, Object.values(context));
        return /*#__PURE__*/ jsx(Context.Provider, {
            value: value,
            children: children
        });
    };
    function useContext(consumerName, selector, shouldThrowOnMissingContext) {
        return ContextSelector.useContextSelector(Context, (ctx)=>{
            // The context is available, return the selected value
            if (ctx) return selector(ctx);
            // The context is not available, either return undefined or throw an error
            if (shouldThrowOnMissingContext) {
                throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
            }
            return undefined;
        });
    }
    Provider.displayName = rootComponentName + 'Provider';
    return [
        Provider,
        useContext
    ];
}

export { createContext };
//# sourceMappingURL=Context.mjs.map
