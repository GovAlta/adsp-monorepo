'use strict';

var fp = require('lodash/fp');
var namespace = require('./namespace.js');

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
     */ getAll (namespace$1) {
            return fp.pickBy((_, uid)=>namespace.hasNamespace(uid, namespace$1))(hooks);
        },
        /**
     * Registers a hook
     */ set (uid, hook) {
            hooks[uid] = hook;
            return this;
        },
        /**
     * Registers a map of hooks for a specific namespace
     */ add (namespace$1, hooks) {
            for (const hookName of Object.keys(hooks)){
                const hook = hooks[hookName];
                const uid = namespace.addNamespace(hookName, namespace$1);
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

module.exports = hooksRegistry;
//# sourceMappingURL=hooks.js.map
