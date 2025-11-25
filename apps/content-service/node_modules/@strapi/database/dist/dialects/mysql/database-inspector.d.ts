import { MARIADB, MYSQL } from './constants';
import type { Database } from '../..';
export interface Information {
    database: typeof MARIADB | typeof MYSQL | null;
    version: string | null;
}
export default class MysqlDatabaseInspector {
    db: Database;
    constructor(db: Database);
    getInformation(nativeConnection?: unknown): Promise<Information>;
}
//# sourceMappingURL=database-inspector.d.ts.map