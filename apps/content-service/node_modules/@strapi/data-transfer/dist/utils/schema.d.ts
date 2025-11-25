import type { Struct, Utils } from '@strapi/types';
/**
 * Sanitize a schemas dictionary by omitting unwanted properties
 * The list of allowed properties can be found here: {@link VALID_SCHEMA_PROPERTIES}
 */
export declare const mapSchemasValues: (schemas: Utils.String.Dict<Struct.Schema>) => Utils.String.Dict<Struct.Schema>;
export declare const schemasToValidJSON: (schemas: Utils.String.Dict<Struct.Schema>) => any;
//# sourceMappingURL=schema.d.ts.map