'use strict';

var jsxRuntime = require('react/jsx-runtime');
var React = require('react');
var isEqual = require('lodash/isEqual');
var useForceUpdate = require('../hooks/useForceUpdate.js');
var useThrottledCallback = require('../hooks/useThrottledCallback.js');
var shims = require('../utils/shims.js');

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
    const statesRef = React__namespace.useRef({});
    const [tick, forceUpdate] = useForceUpdate.useForceUpdate();
    const requestHandle = React__namespace.useRef(null);
    const requestUpdate = React__namespace.useCallback(()=>{
        if (requestHandle.current) {
            shims.cancelIdleCallback(requestHandle.current);
        }
        requestHandle.current = shims.requestIdleCallback(()=>{
            requestHandle.current = null;
            forceUpdate();
        });
    }, [
        forceUpdate
    ]);
    /**
   * This will avoid us calling too many react updates in a short space of time.
   */ const throttledRequestUpdate = useThrottledCallback.useThrottledCallback(requestUpdate, 60, {
        trailing: true
    });
    const update = React__namespace.useCallback((id, description)=>{
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
    const ids = React__namespace.useMemo(()=>descriptions.map((description)=>getCompId(description)), [
        descriptions
    ]);
    const states = React__namespace.useMemo(()=>ids.map((id)=>statesRef.current[id]?.value).filter((state)=>state !== null && state !== undefined), /**
     * we leave tick in the deps to ensure the memo is recalculated when the `update` function  is called.
     * the `ids` will most likely be stable unless we get new actions, but we can't respond to the Description
     * Component changing the ref data in any other way.
     */ // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        ids,
        tick
    ]);
    return /*#__PURE__*/ jsxRuntime.jsxs(jsxRuntime.Fragment, {
        children: [
            descriptions.map((description)=>{
                const key = getCompId(description);
                return /*#__PURE__*/ jsxRuntime.jsx(Description, {
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
 */ const Description = /*#__PURE__*/ React__namespace.memo(({ description, id, props, update })=>{
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
    const ref = React__namespace.useRef(undefined);
    if (!isEqual(value, ref.current)) {
        ref.current = value;
    }
    return [
        ref.current
    ];
};
const useShallowCompareEffect = (callback, dependencies)=>{
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the linter isn't able to see that deps are properly handled here
    React__namespace.useEffect(callback, useShallowCompareMemoize(dependencies));
};

exports.DescriptionComponentRenderer = DescriptionComponentRenderer;
//# sourceMappingURL=DescriptionComponentRenderer.js.map
