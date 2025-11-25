import PostgresDialect from './postgresql/index.mjs';
import MysqlDialect from './mysql/index.mjs';
import SqliteDialect from './sqlite/index.mjs';

/**
 * Require our dialect-specific code
 */ const getDialectClass = (client)=>{
    switch(client){
        case 'postgres':
            return PostgresDialect;
        case 'mysql':
            return MysqlDialect;
        case 'sqlite':
            return SqliteDialect;
        default:
            throw new Error(`Unknown dialect ${client}`);
    }
};
/**
 * Get the dialect of a database client
 */ const getDialectName = (client)=>{
    switch(client){
        case 'postgres':
            return 'postgres';
        case 'mysql':
            return 'mysql';
        case 'sqlite':
            return 'sqlite';
        default:
            throw new Error(`Unknown dialect ${client}`);
    }
};
const getDialect = (db)=>{
    const { client } = db.config.connection;
    const dialectName = getDialectName(client);
    const constructor = getDialectClass(dialectName);
    const dialect = new constructor(db, dialectName);
    return dialect;
};

export { getDialect };
//# sourceMappingURL=index.mjs.map
