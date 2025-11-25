import type { Database } from '../..';
import type { Schema, Column, Index, ForeignKey } from '../../schema/types';
import type { SchemaInspector } from '../dialect';
export default class SqliteSchemaInspector implements SchemaInspector {
    db: Database;
    constructor(db: Database);
    getSchema(): Promise<Schema>;
    getTables(): Promise<string[]>;
    getColumns(tableName: string): Promise<Column[]>;
    getIndexes(tableName: string): Promise<Index[]>;
    getForeignKeys(tableName: string): Promise<ForeignKey[]>;
}
//# sourceMappingURL=schema-inspector.d.ts.map