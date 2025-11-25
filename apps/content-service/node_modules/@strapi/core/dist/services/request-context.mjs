import { AsyncLocalStorage } from 'async_hooks';

const storage = new AsyncLocalStorage();
const requestCtx = {
    async run (store, cb) {
        return storage.run(store, cb);
    },
    get () {
        return storage.getStore();
    }
};

export { requestCtx as default };
//# sourceMappingURL=request-context.mjs.map
