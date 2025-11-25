'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var ContextSelector = require('use-context-selector');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);
var ContextSelector__namespace = /*#__PURE__*/_interopNamespaceDefault(ContextSelector);

/**
 * @experimental
 * @description Create a context provider and a hook to consume the context.
 *
 * @warning this may be removed to the design-system instead of becoming stable.
 */ function createContext(rootComponentName, defaultContext) {
    const Context = ContextSelector__namespace.createContext(defaultContext);
    const Provider = (props)=>{
        const { children, ...context } = props;
        // Only re-memoize when prop values change
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const value = React__namespace.useMemo(()=>context, Object.values(context));
        return /*#__PURE__*/ jsxRuntime.jsx(Context.Provider, {
            value: value,
            children: children
        });
    };
    function useContext(consumerName, selector, shouldThrowOnMissingContext) {
        return ContextSelector__namespace.useContextSelector(Context, (ctx)=>{
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

exports.createContext = createContext;
//# sourceMappingURL=Context.js.map
