export declare const ɵvalue: unique symbol;
export declare type Container<T> = {
    [ɵvalue]?: T;
};
export declare type Unpack<T extends Container<any>> = Exclude<T[typeof ɵvalue], undefined>;
export interface Generic<T1 = unknown, T2 = unknown, T3 = unknown, T4 = unknown> {
    0: T1;
    1: T2;
    2: T3;
    3: T4;
}
export interface GenericFactory<T1 = unknown, T2 = unknown, T3 = unknown, T4 = unknown> extends Generic<T1, T2, T3, T4> {
    produce: unknown;
}
export declare type ProduceGeneric<T, U> = T extends Container<any> ? (Unpack<T> & Generic<U>)['produce'] : T;
