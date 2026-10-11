import type { InquirerReadline } from '@inquirer/type';
export declare function withHooks<T>(rl: InquirerReadline, cb: (cycle: (render: () => void) => void) => T): T;
export declare function readline(): InquirerReadline;
export declare function withUpdates<Args extends unknown[], R>(fn: (...args: Args) => R): (...args: Args) => R;
type Pointer<Value> = {
    get(): Value;
    set(value: Value): void;
    initialized: boolean;
};
export declare function withPointer<Value, ReturnValue>(cb: (pointer: Pointer<Value>) => ReturnValue): ReturnValue;
export declare function handleChange(): void;
export declare const effectScheduler: {
    queue(cb: (readline: InquirerReadline) => void | (() => void)): void;
    run(): void;
    clearAll(): void;
};
export {};
