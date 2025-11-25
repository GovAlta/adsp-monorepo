'use strict';

var constants = require('./constants.js');

const SQL_QUERIES = {
    VERSION: `SELECT version() as version`
};
class MysqlDatabaseInspector {
    async getInformation(nativeConnection) {
        let database;
        let versionNumber;
        try {
            const [results] = await this.db.connection.raw(SQL_QUERIES.VERSION).connection(nativeConnection);
            const versionSplit = results[0].version.split('-');
            const databaseName = versionSplit[1];
            versionNumber = versionSplit[0];
            database = databaseName && databaseName.toLowerCase() === 'mariadb' ? constants.MARIADB : constants.MYSQL;
        } catch (e) {
            return {
                database: null,
                version: null
            };
        }
        return {
            database,
            version: versionNumber
        };
    }
    constructor(db){
        this.db = db;
    }
}

module.exports = MysqlDatabaseInspector;
//# sourceMappingURL=database-inspector.js.map
