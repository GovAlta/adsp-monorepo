import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import * as React from 'react';
import isEqual from 'lodash/isEqual';
import { useForceUpdate } from '../hooks/useForceUpdate.mjs';
import { useThrottledCallback } from '../hooks/useThrottledCallback.mjs';
import { cancelIdleCallback as _cancelIdleCallback, requestIdleCallback as _requestIdleCallback } from '../utils/shims.mjs';

/**
 * @internal
 *
 * @description This component takes an array of DescriptionComponents, which are react components that return objects as opposed to JSX.
 * We render these in their own isolated memoized component and use an update function to push the data back out to the parent.
 * Saving it in a ref, and then "forcing" an update of the parent component to render the children of this component with the new data.
 *
 * The DescriptionCompoonents can take props and use react hooks hence why we render them as if they were a component. The update
 * function is throttled and managed to avoid erroneous updates where we could wait a single tick to update the entire UI, which
 * creates less "popping" from functions being called in rapid succession.
 */ const DescriptionComponentRenderer = ({ children, props, descriptions })=>{
    const statesRef = React.useRef({});
    const [tick, forceUpdate] = useForceUpdate();
    const requestHandle = React.useRef(null);
    const requestUpdate = React.useCallback(()=>{
        if (requestHandle.current) {
            _cancelIdleCallback(requestHandle.current);
        }
        requestHandle.current = _requestIdleCallback(()=>{
            requestHandle.current = null;
            forceUpdate();
        });
    }, [
        forceUpdate
    ]);
    /**
   * This will avoid us calling too many react updates in a short space of time.
   */ const throttledRequestUpdate = useThrottledCallback(requestUpdate, 60, {
        trailing: true
    });
    const update = React.useCallback((id, description)=>{
        if (description === null) {
            delete statesRef.current[id];
        } else {
            const current = statesRef.current[id];
            statesRef.current[id] = {
                ...current,
                value: {
                    ...description,
                    id
                }
            };
        }
        throttledRequestUpdate();
    }, [
        throttledRequestUpdate
    ]);
    const ids = React.useMemo(()=>descriptions.map((description)=>getCompId(description)), [
        descriptions
    ]);
    const states = React.useMemo(()=>ids.map((id)=>statesRef.current[id]?.value).filter((state)=>state !== null && state !== undefined), /**
     * we leave tick in the deps to ensure the memo is recalculated when the `update` function  is called.
     * the `ids` will most likely be stable unless we get new actions, but we can't respond to the Description
     * Component changing the ref data in any other way.
     */ // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        ids,
        tick
    ]);
    return /*#__PURE__*/ jsxs(Fragment, {
        children: [
            descriptions.map((description)=>{
                const key = getCompId(description);
                return /*#__PURE__*/ jsx(Description, {
                    id: key,
                    description: description,
                    props: props,
                    update: update
                }, key);
            }),
            children(states)
        ]
    });
};
/**
 * Descriptions are objects, but to create the object, we allow users to create components,
 * this means they can use react hooks in them. It also means we need to render them
 * within a component, however because they return an object of data we can't add that
 * to the react tree, instead we push it back out to the parent.
 */ const Description = /*#__PURE__*/ React.memo(({ description, id, props, update })=>{
    const comp = description(props);
    useShallowCompareEffect(()=>{
        update(id, comp);
        return ()=>{
            update(id, null);
        };
    }, comp);
    return null;
}, (prev, next)=>isEqual(prev.props, next.props));
/* -------------------------------------------------------------------------------------------------
 * Helpers
 * -----------------------------------------------------------------------------------------------*/ const ids = new WeakMap();
let counter = 0;
function getCompId(comp) {
    const cachedId = ids.get(comp);
    if (cachedId) return cachedId;
    const id = `${comp.name || comp.displayName || '<anonymous>'}-${counter++}`;
    ids.set(comp, id);
    return id;
}
const useShallowCompareMemoize = (value)=>{
    const ref = React.useRef(undefined);
    if (!isEqual(value, ref.current)) {
        ref.current = value;
    }
    return [
        ref.current
    ];
};
const useShallowCompareEffect = (callback, dependencies)=>{
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the linter isn't able to see that deps are properly handled here
    React.useEffect(callback, useShallowCompareMemoize(dependencies));
};

export { DescriptionComponentRenderer };
//# sourceMappingURL=DescriptionComponentRenderer.mjs.map
