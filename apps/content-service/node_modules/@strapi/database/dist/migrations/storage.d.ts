import type { Database } from '..';
export interface Options {
    db: Database;
    tableName: string;
}
export declare const createStorage: (opts: Options) => {
    logMigration({ name }: {
        name: string;
    }): Promise<void>;
    unlogMigration({ name }: {
        name: string;
    }): Promise<void>;
    executed(): Promise<any>;
};
//# sourceMappingURL=storage.d.ts.map