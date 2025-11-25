import type { Database } from '../..';
export interface RemoveOrphanMorphTypeOptions {
    pivot: string;
}
/**
 * Removes morph relation data with invalid or non-existent morph type.
 *
 * This function iterates over the database metadata to identify morph relationships
 * (relations with a `joinTable` containing the specified pivot column) and removes
 * any entries in the relation's join table where the morph type is invalid.
 *
 * Note: This function does not check for orphaned IDs, only orphaned morph types.
 *
 * @param db - The database object containing metadata and a Knex connection.
 * @param options.pivot - The name of the column in the join table representing the morph type.
 */
export declare const removeOrphanMorphType: (db: Database, { pivot }: RemoveOrphanMorphTypeOptions) => Promise<void>;
//# sourceMappingURL=remove-orphan-morph-types.d.ts.map