import type { Core } from '@strapi/types';
export interface PersistedTable {
    name: string;
    dependsOn?: Array<{
        name: string;
    }>;
}
/**
 * Finds all tables in the database matching the regular expression
 * @param {Object} ctx
 * @param {Strapi} ctx.strapi
 * @param {RegExp} regex
 * @returns {Promise<string[]>}
 */
export declare function findTables({ strapi }: {
    strapi: Core.Strapi;
}, regex: any): Promise<string[]>;
/**
 * Add all table names that start with a prefix to the reserved tables in
 * core store
 * @param {string} tableNamePrefix
 * @return {Promise<void>}
 */
export declare const persistTablesWithPrefix: (tableNamePrefix: string) => Promise<void>;
/**
 * Remove all table names that end with a suffix from the reserved tables in core store
 * @param {string} tableNameSuffix
 * @return {Promise<void>}
 */
export declare const removePersistedTablesWithSuffix: (tableNameSuffix: string) => Promise<void>;
/**
 * Add tables to the reserved tables in core store
 */
export declare const persistTables: (tables: Array<string | PersistedTable>) => Promise<void>;
declare const _default: {
    persistTablesWithPrefix: (tableNamePrefix: string) => Promise<void>;
    removePersistedTablesWithSuffix: (tableNameSuffix: string) => Promise<void>;
    persistTables: (tables: (string | PersistedTable)[]) => Promise<void>;
    findTables: typeof findTables;
};
export default _default;
//# sourceMappingURL=persist-tables.d.ts.map