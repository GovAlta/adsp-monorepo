'use strict';

var React = require('react');
var hooks = require('../core/store/hooks.js');

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
 */ function useInjectReducer(namespace, reducer) {
    const store = hooks.useTypedStore();
    React.useEffect(()=>{
        store.injectReducer(namespace, reducer);
    }, [
        store,
        namespace,
        reducer
    ]);
}

exports.useInjectReducer = useInjectReducer;
//# sourceMappingURL=useInjectReducer.js.map
