'use strict';

var React = require('react');
var throttle = require('lodash/throttle');

/**
 * @internal
 * @description Create a throttled version of a callback
 * @example
 * ```tsx
 * // First create a callback using React’s `useCallback` hook
 * const myCallback = useCallback(() => {
 *   // this is not throttled
 * }, [])
 *
 * // Then make a throttled version using the `useThrottledCallback` hook
 * const myThrottledCallback = useThrottledCallback(myCallback, 100)
 *
 * // Call the throttled callback
 * <Button onClick={myThrottledCallback} />
 * ```
 */ const useThrottledCallback = (callback, wait, options)=>{
    const throttledCallback = React.useMemo(()=>throttle(callback, wait, options), [
        callback,
        options,
        wait
    ]);
    return throttledCallback;
};

exports.useThrottledCallback = useThrottledCallback;
//# sourceMappingURL=useThrottledCallback.js.map
