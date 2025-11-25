'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fp = require('lodash/fp');

/**
 * Transform table name to the object format
 */ const transformTableName = (table)=>{
    if (typeof table === 'string') {
        return {
            name: table
        };
    }
    return table;
};
/**
 * Finds all tables in the database matching the regular expression
 * @param {Object} ctx
 * @param {Strapi} ctx.strapi
 * @param {RegExp} regex
 * @returns {Promise<string[]>}
 */ async function findTables({ strapi: strapi1 }, regex) {
    const tables = await strapi1.db.dialect.schemaInspector.getTables();
    return tables.filter((tableName)=>regex.test(tableName));
}
/**
 * Add tables name to the reserved tables in core store
 */ async function addPersistTables({ strapi: strapi1 }, tableNames) {
    const persistedTables = await getPersistedTables({
        strapi: strapi1
    });
    const tables = tableNames.map(transformTableName);
    // Get new tables to be persisted, remove tables if they already were persisted
    const notPersistedTableNames = fp.differenceWith(fp.isEqual, tables, persistedTables);
    // Remove tables that are going to be changed
    const tablesToPersist = fp.differenceWith((t1, t2)=>t1.name === t2.name, persistedTables, notPersistedTableNames);
    if (!notPersistedTableNames.length) {
        return;
    }
    // @ts-expect-error lodash types
    tablesToPersist.push(...notPersistedTableNames);
    await strapi1.store.set({
        type: 'core',
        key: 'persisted_tables',
        value: tablesToPersist
    });
}
/**
 * Get all reserved table names from the core store
 * @param {Object} ctx
 * @param {Strapi} ctx.strapi
 * @param {RegExp} regex
 * @returns {Promise<string[]>}
 */ async function getPersistedTables({ strapi: strapi1 }) {
    const persistedTables = await strapi1.store.get({
        type: 'core',
        key: 'persisted_tables'
    });
    return (persistedTables || []).map(transformTableName);
}
/**
 * Set all reserved table names in the core store
 * @param {Object} ctx
 * @param {Strapi} ctx.strapi
 * @param {Array<string|{ table: string; dependsOn?: Array<{ table: string;}> }>} tableNames
 * @returns {Promise<void>}
 */ async function setPersistedTables({ strapi: strapi1 }, tableNames) {
    await strapi1.store.set({
        type: 'core',
        key: 'persisted_tables',
        value: tableNames
    });
}
/**
 * Add all table names that start with a prefix to the reserved tables in
 * core store
 * @param {string} tableNamePrefix
 * @return {Promise<void>}
 */ const persistTablesWithPrefix = async (tableNamePrefix)=>{
    const tableNameRegex = new RegExp(`^${tableNamePrefix}.*`);
    const tableNames = await findTables({
        strapi
    }, tableNameRegex);
    await addPersistTables({
        strapi
    }, tableNames);
};
/**
 * Remove all table names that end with a suffix from the reserved tables in core store
 * @param {string} tableNameSuffix
 * @return {Promise<void>}
 */ const removePersistedTablesWithSuffix = async (tableNameSuffix)=>{
    const tableNameRegex = new RegExp(`.*${tableNameSuffix}$`);
    const persistedTables = await getPersistedTables({
        strapi
    });
    const filteredPersistedTables = persistedTables.filter((table)=>{
        return !tableNameRegex.test(table.name);
    });
    if (filteredPersistedTables.length === persistedTables.length) {
        return;
    }
    await setPersistedTables({
        strapi
    }, filteredPersistedTables);
};
/**
 * Add tables to the reserved tables in core store
 */ const persistTables = async (tables)=>{
    await addPersistTables({
        strapi
    }, tables);
};
var persistTables$1 = {
    persistTablesWithPrefix,
    removePersistedTablesWithSuffix,
    persistTables,
    findTables
};

exports.default = persistTables$1;
exports.findTables = findTables;
exports.persistTables = persistTables;
exports.persistTablesWithPrefix = persistTablesWithPrefix;
exports.removePersistedTablesWithSuffix = removePersistedTablesWithSuffix;
//# sourceMappingURL=persist-tables.js.map
