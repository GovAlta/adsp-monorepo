import type { Knex } from 'knex';
import type { Database } from '..';
import type { Schema, Table, SchemaDiff } from './types';
declare const _default: (db: Database) => {
    /**
     * Returns a knex schema builder instance
     * @param {string} table - table name
     */
    getSchemaBuilder(trx: Knex.Transaction): Knex.SchemaBuilder;
    /**
     * Creates schema in DB
     */
    createSchema(schema: Schema): Promise<void>;
    /**
     * Creates a list of tables in a schema
     * @param {KnexInstance} trx
     * @param {Table[]} tables
     */
    createTables(tables: Table[], trx: Knex.Transaction): Promise<void>;
    /**
     * Drops schema from DB
     */
    dropSchema(schema: Schema, { dropDatabase }?: {
        dropDatabase?: boolean | undefined;
    }): Promise<void>;
    /**
     * Applies a schema diff update in the DB
     * @param {*} schemaDiff
     */
    updateSchema(schemaDiff: SchemaDiff['diff']): Promise<void>;
};
export default _default;
//# sourceMappingURL=builder.d.ts.map