import createSchemaBuilder from './builder';
import createSchemaDiff from './diff';
import createSchemaStorage from './storage';
import type { Schema, SchemaDiff } from './types';
import type { Database } from '..';
export type * from './types';
export interface SchemaProvider {
    builder: ReturnType<typeof createSchemaBuilder>;
    schemaDiff: ReturnType<typeof createSchemaDiff>;
    schemaStorage: ReturnType<typeof createSchemaStorage>;
    sync(): Promise<SchemaDiff['status']>;
    syncSchema(): Promise<SchemaDiff['status']>;
    reset(): Promise<void>;
    create(): Promise<void>;
    drop(): Promise<void>;
    schema: Schema;
}
export declare const createSchemaProvider: (db: Database) => SchemaProvider;
//# sourceMappingURL=index.d.ts.map