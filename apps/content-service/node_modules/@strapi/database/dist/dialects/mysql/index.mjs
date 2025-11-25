import Dialect from '../dialect.mjs';
import MysqlSchemaInspector from './schema-inspector.mjs';
import MysqlDatabaseInspector from './database-inspector.mjs';

class MysqlDialect extends Dialect {
    configure() {
        const connection = this.db.config.connection.connection;
        connection.supportBigNumbers = true;
        // Only allow bigNumberStrings option set to be true if no connection option passed
        // Otherwise bigNumberStrings option should be allowed to used from DB config
        if (connection.bigNumberStrings === undefined) {
            connection.bigNumberStrings = true;
        }
        connection.typeCast = (field, next)=>{
            if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') {
                const value = field.string();
                return value === null ? null : Number(value);
            }
            if (field.type === 'TINY' && field.length === 1) {
                const value = field.string();
                return value ? value === '1' : null;
            }
            if (field.type === 'DATE') {
                return field.string();
            }
            return next();
        };
    }
    async initialize(nativeConnection) {
        try {
            await this.db.connection.raw(`set session sql_require_primary_key = 0;`).connection(nativeConnection);
        } catch (err) {
        // Ignore error due to lack of session permissions
        }
        // We only need to get info on the first connection in the pool
        /**
     * Note: There is a race condition here where if two connections are opened at the same time, both will retrieve
     * db info, but it doesn't cause issues, it's just one wasted query one time, so we can safely leave it to avoid
     * adding extra complexity
     * */ if (!this.info) {
            this.info = await this.databaseInspector.getInformation(nativeConnection);
        }
    }
    async startSchemaUpdate() {
        try {
            await this.db.connection.raw(`set foreign_key_checks = 0;`);
            await this.db.connection.raw(`set session sql_require_primary_key = 0;`);
        } catch (err) {
        // Ignore error due to lack of session permissions
        }
    }
    async endSchemaUpdate() {
        await this.db.connection.raw(`set foreign_key_checks = 1;`);
    }
    supportsUnsigned() {
        return true;
    }
    usesForeignKeys() {
        return true;
    }
    transformErrors(error) {
        super.transformErrors(error);
    }
    constructor(db){
        super(db, 'mysql');
        this.info = null;
        this.schemaInspector = new MysqlSchemaInspector(db);
        this.databaseInspector = new MysqlDatabaseInspector(db);
    }
}

export { MysqlDialect as default };
//# sourceMappingURL=index.mjs.map
