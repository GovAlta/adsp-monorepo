import { useEffect } from 'react';
import { useTypedStore } from '../core/store/hooks.mjs';

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
    const store = useTypedStore();
    useEffect(()=>{
        store.injectReducer(namespace, reducer);
    }, [
        store,
        namespace,
        reducer
    ]);
}

export { useInjectReducer };
//# sourceMappingURL=useInjectReducer.mjs.map
