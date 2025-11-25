import type { InitialState } from './init';
export interface ActionOnChange {
    type: string;
    keys?: string;
    value: string | number;
}
export interface ActionSetLoaded {
    type: string;
}
interface ActionInitialValue {
    type: string;
}
export type Action = ActionSetLoaded | ActionOnChange | ActionInitialValue;
export declare const reducer: (state?: InitialState, action?: Action) => InitialState;
export {};
