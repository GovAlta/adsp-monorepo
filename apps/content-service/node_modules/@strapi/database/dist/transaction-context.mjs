import { AsyncLocalStorage } from 'node:async_hooks';

const storage = new AsyncLocalStorage();
const transactionCtx = {
    async run (trx, cb) {
        const store = storage.getStore();
        return storage.run({
            trx,
            // Fill with existing callbacks if nesting transactions
            commitCallbacks: store?.commitCallbacks || [],
            rollbackCallbacks: store?.rollbackCallbacks || []
        }, cb);
    },
    get () {
        const store = storage.getStore();
        return store?.trx;
    },
    async commit (trx) {
        const store = storage.getStore();
        // Clear transaction from store
        if (store?.trx) {
            store.trx = null;
        }
        // Commit transaction
        await trx.commit();
        if (!store?.commitCallbacks.length) {
            return;
        }
        // Run callbacks
        store.commitCallbacks.forEach((cb)=>cb());
        store.commitCallbacks = [];
    },
    async rollback (trx) {
        const store = storage.getStore();
        // Clear transaction from store
        if (store?.trx) {
            store.trx = null;
        }
        // Rollback transaction
        await trx.rollback();
        if (!store?.rollbackCallbacks.length) {
            return;
        }
        // Run callbacks
        store.rollbackCallbacks.forEach((cb)=>cb());
        store.rollbackCallbacks = [];
    },
    onCommit (cb) {
        const store = storage.getStore();
        if (store?.commitCallbacks) {
            store.commitCallbacks.push(cb);
        }
    },
    onRollback (cb) {
        const store = storage.getStore();
        if (store?.rollbackCallbacks) {
            store.rollbackCallbacks.push(cb);
        }
    }
};

export { transactionCtx };
//# sourceMappingURL=transaction-context.mjs.map
