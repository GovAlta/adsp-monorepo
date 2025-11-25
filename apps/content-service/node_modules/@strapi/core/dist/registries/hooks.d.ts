/// <reference types="lodash" />
type Handler = (context: any) => any;
type AsyncHook = {
    handlers: Handler[];
    register(handler: Handler): AsyncHook;
    delete(handler: Handler): AsyncHook;
    call(): Promise<void>;
};
type SyncHook = {
    get handlers(): Handler[];
    register(handler: Handler): SyncHook;
    delete(handler: Handler): SyncHook;
    call(): void;
};
export type Hook = AsyncHook | SyncHook;
type HookExtendFn = (hook: Hook) => Hook;
declare const hooksRegistry: () => {
    /**
     * Returns this list of registered hooks uids
     */
    keys(): string[];
    /**
     * Returns the instance of a hook.
     */
    get(uid: string): Hook;
    /**
     * Returns a map with all the hooks in a namespace
     */
    getAll(namespace: string): import("lodash").Dictionary<unknown>;
    /**
     * Registers a hook
     */
    set(uid: string, hook: Hook): any;
    /**
     * Registers a map of hooks for a specific namespace
     */
    add(namespace: string, hooks: Record<string, Hook>): any;
    /**
     * Wraps a hook to extend it
     */
    extend(uid: string, extendFn: HookExtendFn): any;
};
export default hooksRegistry;
//# sourceMappingURL=hooks.d.ts.map