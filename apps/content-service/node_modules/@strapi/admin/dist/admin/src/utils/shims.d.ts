declare const _requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions | undefined) => number;
declare const _cancelIdleCallback: (handle: number) => void;
export { _requestIdleCallback as requestIdleCallback };
export { _cancelIdleCallback as cancelIdleCallback };
