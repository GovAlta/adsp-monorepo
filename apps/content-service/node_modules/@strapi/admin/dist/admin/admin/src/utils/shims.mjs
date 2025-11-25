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

export { _cancelIdleCallback as cancelIdleCallback, _requestIdleCallback as requestIdleCallback };
//# sourceMappingURL=shims.mjs.map
