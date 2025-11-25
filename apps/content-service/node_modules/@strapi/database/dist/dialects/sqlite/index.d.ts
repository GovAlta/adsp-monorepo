/// <reference types="node" />
import type { Knex } from 'knex';
import Dialect from '../dialect';
import SqliteSchemaInspector from './schema-inspector';
import type { Database } from '../..';
export default class SqliteDialect extends Dialect {
    schemaInspector: SqliteSchemaInspector;
    constructor(db: Database);
    configure(conn?: Knex.Sqlite3ConnectionConfig): void;
    useReturning(): boolean;
    initialize(nativeConnection: unknown): Promise<void>;
    canAlterConstraints(): boolean;
    getSqlType(type: string): string;
    supportsOperator(operator: string): boolean;
    startSchemaUpdate(): Promise<void>;
    endSchemaUpdate(): Promise<void>;
    transformErrors(error: NodeJS.ErrnoException): void;
    canAddIncrements(): boolean;
}
//# sourceMappingURL=index.d.ts.map