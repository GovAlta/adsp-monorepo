import type { Action, Event, Params, Subscriber } from './types';
import type { Database } from '..';
export type * from './types';
export type State = Record<string, unknown>;
export type States = Map<Subscriber, State>;
export interface Properties {
    params: Params;
    result?: unknown;
}
export interface LifecycleProvider {
    subscribe(subscriber: Subscriber): () => void;
    clear(): void;
    run(action: Action, uid: string, properties: Properties, states?: States): Promise<States>;
    createEvent(action: Action, uid: string, properties: Properties, state: State): Event;
    disable(): void;
    enable(): void;
}
export declare const createLifecyclesProvider: (db: Database) => LifecycleProvider;
//# sourceMappingURL=index.d.ts.map