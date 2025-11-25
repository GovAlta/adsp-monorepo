'use strict';

/* -------------------------------------------------------------------------------------------------
 * requestIdleCallbackShim
 * -----------------------------------------------------------------------------------------------*/ const requestIdleCallbackShim = (callback)=>{
    const start = Date.now();
    return setTimeout(()=>{
        callback({
            didTimeout: false,
            timeRemaining () {
                return Math.max(0, Date.now() - start);
            }
        });
    }, 1);
};
const _requestIdleCallback = typeof requestIdleCallback === 'undefined' ? requestIdleCallbackShim : requestIdleCallback;
/* -------------------------------------------------------------------------------------------------
 * cancelIdleCallbackShim
 * -----------------------------------------------------------------------------------------------*/ const cancelIdleCallbackShim = (handle)=>{
    return clearTimeout(handle);
};
const _cancelIdleCallback = typeof cancelIdleCallback === 'undefined' ? cancelIdleCallbackShim : cancelIdleCallback;

exports.cancelIdleCallback = _cancelIdleCallback;
exports.requestIdleCallback = _requestIdleCallback;
//# sourceMappingURL=shims.js.map
