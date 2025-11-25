import type { Column, ForeignKey, Index, Schema } from '../../schema/types';
import type { SchemaInspector } from '../dialect';
import type { Database } from '../..';
export default class MysqlSchemaInspector implements SchemaInspector {
    db: Database;
    constructor(db: Database);
    getSchema(): Promise<Schema>;
    getTables(): Promise<string[]>;
    getColumns(tableName: string): Promise<Column[]>;
    getIndexes(tableName: string): Promise<Index[]>;
    getForeignKeys(tableName: string): Promise<ForeignKey[]>;
}
//# sourceMappingURL=schema-inspector.d.ts.map