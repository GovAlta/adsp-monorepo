import { Knex } from 'knex';
export type Callback = (...args: any[]) => Promise<any> | any;
export interface TransactionObject {
    commit: () => Promise<void>;
    rollback: () => Promise<void>;
    get: () => Knex.Transaction;
}
export interface Store {
    trx: Knex.Transaction | null;
    commitCallbacks: Callback[];
    rollbackCallbacks: Callback[];
}
declare const transactionCtx: {
    run<TCallback extends Callback>(trx: Knex.Transaction, cb: TCallback): Promise<ReturnType<TCallback>>;
    get(): Knex.Transaction<any, any[]> | null | undefined;
    commit(trx: Knex.Transaction): Promise<void>;
    rollback(trx: Knex.Transaction): Promise<void>;
    onCommit(cb: Callback): void;
    onRollback(cb: Callback): void;
};
export { transactionCtx };
//# sourceMappingURL=transaction-context.d.ts.map