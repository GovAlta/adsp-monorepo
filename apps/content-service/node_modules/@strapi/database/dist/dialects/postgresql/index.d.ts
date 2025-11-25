/// <reference types="node" />
import type { Database } from '../..';
import Dialect from '../dialect';
import PostgresqlSchemaInspector from './schema-inspector';
export default class PostgresDialect extends Dialect {
    schemaInspector: PostgresqlSchemaInspector;
    constructor(db: Database);
    useReturning(): boolean;
    initialize(nativeConnection: unknown): Promise<void>;
    usesForeignKeys(): boolean;
    getSqlType(type: string): string;
    transformErrors(error: NodeJS.ErrnoException): void;
    /**
     * Get column type conversion SQL with USING clause for PostgreSQL
     * @param currentType - The current PostgreSQL data type
     * @param targetType - The target Strapi type
     * @returns SQL string with USING clause or null if no special conversion needed
     */
    getColumnTypeConversionSQL(currentType: string, targetType: string): {
        sql: string;
        typeClause: string;
        warning?: string;
    } | null;
}
//# sourceMappingURL=index.d.ts.map