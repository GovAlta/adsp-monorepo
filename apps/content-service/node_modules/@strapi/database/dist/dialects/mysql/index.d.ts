import Dialect from '../dialect';
import MysqlSchemaInspector from './schema-inspector';
import MysqlDatabaseInspector from './database-inspector';
import type { Database } from '../..';
import type { Information } from './database-inspector';
export default class MysqlDialect extends Dialect {
    schemaInspector: MysqlSchemaInspector;
    databaseInspector: MysqlDatabaseInspector;
    info: Information | null;
    constructor(db: Database);
    configure(): void;
    initialize(nativeConnection: unknown): Promise<void>;
    startSchemaUpdate(): Promise<void>;
    endSchemaUpdate(): Promise<void>;
    supportsUnsigned(): boolean;
    usesForeignKeys(): boolean;
    transformErrors(error: Error): void;
}
//# sourceMappingURL=index.d.ts.map