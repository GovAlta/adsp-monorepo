import type { Store } from '../store/configure';
export type Handler = (...args: any[]) => any;
export declare const createHook: () => {
    register(fn: Handler): void;
    delete(handler: Handler): void;
    runWaterfall<T>(args: T, store?: Store): T;
    runWaterfallAsync<T_1>(args: T_1, store?: Store): Promise<T_1>;
    runSeries<T_2 extends any[]>(...args: T_2): any[];
    runSeriesAsync<T_3 extends any[]>(...args: T_3): Promise<any[]>;
    runParallel<T_4 extends any[]>(...args: T_4): Promise<any[]>;
};
