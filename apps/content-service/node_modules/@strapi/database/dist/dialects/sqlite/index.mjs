import path from 'path';
import fse from 'fs-extra';
import NotNullError from '../../errors/not-null.mjs';
import Dialect from '../dialect.mjs';
import SqliteSchemaInspector from './schema-inspector.mjs';

const UNSUPPORTED_OPERATORS = [
    '$jsonSupersetOf'
];
class SqliteDialect extends Dialect {
    configure(conn) {
        const connection = conn || this.db.config.connection.connection;
        if (typeof connection !== 'string') {
            connection.filename = path.resolve(connection.filename);
        }
        const dbDir = path.dirname(connection.filename);
        fse.ensureDirSync(dbDir);
    }
    useReturning() {
        return true;
    }
    async initialize(nativeConnection) {
        await this.db.connection.raw('pragma foreign_keys = on').connection(nativeConnection);
    }
    canAlterConstraints() {
        return false;
    }
    getSqlType(type) {
        switch(type){
            case 'enum':
                {
                    return 'text';
                }
            case 'double':
            case 'decimal':
                {
                    return 'float';
                }
            case 'timestamp':
                {
                    return 'datetime';
                }
            default:
                {
                    return type;
                }
        }
    }
    supportsOperator(operator) {
        return !UNSUPPORTED_OPERATORS.includes(operator);
    }
    async startSchemaUpdate() {
        await this.db.connection.raw(`pragma foreign_keys = off`);
    }
    async endSchemaUpdate() {
        await this.db.connection.raw(`pragma foreign_keys = on`);
    }
    transformErrors(error) {
        switch(error.errno){
            case 19:
                {
                    throw new NotNullError(); // TODO: extract column name
                }
            default:
                {
                    super.transformErrors(error);
                }
        }
    }
    canAddIncrements() {
        return false;
    }
    constructor(db){
        super(db, 'sqlite');
        this.schemaInspector = new SqliteSchemaInspector(db);
    }
}

export { SqliteDialect as default };
//# sourceMappingURL=index.mjs.map
