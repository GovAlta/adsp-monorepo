import { pickBy } from 'lodash/fp';
import { hasNamespace, addNamespace } from './namespace.mjs';

const hooksRegistry = ()=>{
    const hooks = {};
    return {
        /**
     * Returns this list of registered hooks uids
     */ keys () {
            return Object.keys(hooks);
        },
        /**
     * Returns the instance of a hook.
     */ get (uid) {
            return hooks[uid];
        },
        /**
     * Returns a map with all the hooks in a namespace
     */ getAll (namespace) {
            return pickBy((_, uid)=>hasNamespace(uid, namespace))(hooks);
        },
        /**
     * Registers a hook
     */ set (uid, hook) {
            hooks[uid] = hook;
            return this;
        },
        /**
     * Registers a map of hooks for a specific namespace
     */ add (namespace, hooks) {
            for (const hookName of Object.keys(hooks)){
                const hook = hooks[hookName];
                const uid = addNamespace(hookName, namespace);
                this.set(uid, hook);
            }
            return this;
        },
        /**
     * Wraps a hook to extend it
     */ extend (uid, extendFn) {
            const currentHook = this.get(uid);
            if (!currentHook) {
                throw new Error(`Hook ${uid} doesn't exist`);
            }
            const newHook = extendFn(currentHook);
            hooks[uid] = newHook;
            return this;
        }
    };
};

export { hooksRegistry as default };
//# sourceMappingURL=hooks.mjs.map
