type NotFunction<T> = T extends (...args: never) => unknown ? never : T;
type Reducer<Value> = (currentValue: Value) => Value;
type SetState<Value> = (newValue: NotFunction<Value> | Reducer<Value>) => void;
type OptionalSetState<Value> = (newValue?: NotFunction<Value> | Reducer<Value>) => void;
export declare function useState<Value>(defaultValue: NotFunction<Value> | (() => Value)): [Value, SetState<Value>];
export declare function useState<Value>(defaultValue?: NotFunction<Value> | (() => Value)): [Value | undefined, OptionalSetState<Value | undefined>];
export {};
