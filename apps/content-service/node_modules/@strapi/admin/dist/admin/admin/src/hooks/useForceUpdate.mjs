import * as React from 'react';
import { useIsMounted } from './useIsMounted.mjs';

/**
 * @internal
 * @description Return a function that re-renders this component, if still mounted
 * @warning DO NOT USE EXCEPT SPECIAL CASES.
 */ const useForceUpdate = ()=>{
    const [tick, update] = React.useState();
    const isMounted = useIsMounted();
    const forceUpdate = React.useCallback(()=>{
        if (isMounted.current) {
            update(Math.random());
        }
    }, [
        isMounted,
        update
    ]);
    return [
        tick,
        forceUpdate
    ];
};

export { useForceUpdate };
//# sourceMappingURL=useForceUpdate.mjs.map
