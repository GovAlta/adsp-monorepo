import type { Knex } from 'knex';
import type { Database } from '..';
/**
 * @internal
 */
export declare function isKnexQuery(value: unknown): value is Knex.Raw | Knex.QueryBuilder;
/**
 * Adds the name of the schema to the table name if the schema was defined by the user.
 * Users can set the db schema only for Postgres in strapi database config.
 */
export declare const addSchema: (db: Database, tableName: string) => string;
//# sourceMappingURL=knex.d.ts.map