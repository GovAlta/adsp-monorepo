'use strict';

var KnexBuilder = require('knex/lib/query/querybuilder');
var KnexRaw = require('knex/lib/raw');

/**
 * @internal
 */ function isKnexQuery(value) {
    return value instanceof KnexBuilder || value instanceof KnexRaw;
}
/**
 * Adds the name of the schema to the table name if the schema was defined by the user.
 * Users can set the db schema only for Postgres in strapi database config.
 */ const addSchema = (db, tableName)=>{
    const schemaName = db.getSchemaName();
    return schemaName ? `${schemaName}.${tableName}` : tableName;
};

exports.addSchema = addSchema;
exports.isKnexQuery = isKnexQuery;
//# sourceMappingURL=knex.js.map
