export type Handler = (...args: any[]) => any;
export interface Hook<T extends Handler = Handler> {
    getHandlers(): Handler[];
    register(handler: T): Hook<T>;
    delete(handler: T): Hook<T>;
    call(...args: any[]): void;
}
export interface AsyncSeriesHook extends Hook {
    call(...args: any[]): Promise<void>;
}
export interface AsyncSeriesWaterfallHook extends Hook {
    call(...args: any[]): Promise<any>;
}
export interface AsyncParallelHook extends Hook {
    call(...args: any[]): Promise<any[]>;
}
export interface AsyncBailHook extends Hook {
    call(...args: any[]): Promise<any>;
}
/**
 * Create an async series hook.
 * Upon execution, it will execute every handler in order with the same context
 */
declare const createAsyncSeriesHook: <T extends Handler = Handler>() => {
    call(context: unknown): Promise<void>;
    getHandlers(): Handler[];
    register(handler: T): Hook<T>;
    delete(handler: T): Hook<T>;
};
/**
 * Create an async series waterfall hook.
 * Upon execution, it will execute every handler in order and pass the return value of the last handler to the next one
 */
declare const createAsyncSeriesWaterfallHook: <T extends Handler = Handler>() => {
    call(param: unknown): Promise<unknown>;
    getHandlers(): Handler[];
    register(handler: T): Hook<T>;
    delete(handler: T): Hook<T>;
};
/**
 * Create an async parallel hook.
 * Upon execution, it will execute every registered handler in band.
 */
declare const createAsyncParallelHook: <T extends Handler = Handler>() => {
    call(context: unknown): Promise<any[]>;
    getHandlers(): Handler[];
    register(handler: T): Hook<T>;
    delete(handler: T): Hook<T>;
};
/**
 * Create an async parallel hook.
 * Upon execution, it will execute every registered handler in serie and return the first result found.
 */
declare const createAsyncBailHook: <T extends Handler = Handler>() => {
    call(context: unknown): Promise<any>;
    getHandlers(): Handler[];
    register(handler: T): Hook<T>;
    delete(handler: T): Hook<T>;
};
export declare const internals: {
    createHook: <T extends Handler = Handler>() => Hook<T>;
};
export { createAsyncSeriesHook, createAsyncSeriesWaterfallHook, createAsyncParallelHook, createAsyncBailHook, };
//# sourceMappingURL=hooks.d.ts.map