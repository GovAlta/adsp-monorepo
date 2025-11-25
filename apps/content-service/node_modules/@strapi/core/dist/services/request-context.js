'use strict';

var async_hooks = require('async_hooks');

const storage = new async_hooks.AsyncLocalStorage();
const requestCtx = {
    async run (store, cb) {
        return storage.run(store, cb);
    },
    get () {
        return storage.getStore();
    }
};

module.exports = requestCtx;
//# sourceMappingURL=request-context.js.map
