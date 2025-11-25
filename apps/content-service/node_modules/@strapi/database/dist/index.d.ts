import type { Knex } from 'knex';
import { Dialect } from './dialects';
import { SchemaProvider } from './schema';
import { Metadata } from './metadata';
import { EntityManager } from './entity-manager';
import { MigrationProvider, type Migration } from './migrations';
import { LifecycleProvider } from './lifecycles';
import * as errors from './errors';
import { Callback, TransactionObject } from './transaction-context';
import type { Model, JoinTable } from './types';
import type { Identifiers } from './utils/identifiers';
import { type RepairManager } from './repairs';
export { isKnexQuery } from './utils/knex';
interface Settings {
    forceMigration?: boolean;
    runMigrations?: boolean;
    migrations: {
        dir: string;
    };
    [key: string]: unknown;
}
export type Logger = Record<'info' | 'warn' | 'error' | 'debug', (message: string | Record<string, unknown>) => void>;
export interface DatabaseConfig {
    connection: Knex.Config;
    settings: Settings;
    logger?: Logger;
}
declare class Database {
    connection: Knex;
    dialect: Dialect;
    config: DatabaseConfig;
    metadata: Metadata;
    schema: SchemaProvider;
    migrations: MigrationProvider;
    lifecycles: LifecycleProvider;
    entityManager: EntityManager;
    repair: RepairManager;
    logger: Logger;
    constructor(config: DatabaseConfig);
    init({ models }: {
        models: Model[];
    }): Promise<this>;
    query(uid: string): import("./entity-manager").Repository;
    inTransaction(): boolean;
    transaction(): Promise<TransactionObject>;
    transaction<TCallback extends Callback>(c: TCallback): Promise<ReturnType<TCallback>>;
    getSchemaName(): string | undefined;
    getConnection(): Knex;
    getConnection(tableName?: string): Knex.QueryBuilder;
    getInfo(): {
        displayName: string;
        schema: any;
        client: string;
    };
    getSchemaConnection(trx?: Knex<any, any[]>): Knex.SchemaBuilder;
    queryBuilder(uid: string): import("./query/query-builder").QueryBuilder;
    destroy(): Promise<void>;
}
export { Database, errors };
export type { Model, JoinTable, Identifiers, Migration };
//# sourceMappingURL=index.d.ts.map