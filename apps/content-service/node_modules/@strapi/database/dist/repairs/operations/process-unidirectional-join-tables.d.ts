import type { Database } from '../..';
/**
 * Iterates over all models and their unidirectional relations, invoking a provided operation on each join table.
 *
 * This function does not perform any cleaning or modification itself. Instead, it identifies all unidirectional
 * relations (relations without inversedBy or mappedBy) that use join tables, and delegates any join table operation
 * (such as cleaning, validation, or analysis) to the provided operateOnJoinTable function.
 *
 * @param db - The database instance
 * @param operateOnJoinTable - A function to execute for each unidirectional join table relation
 * @returns The sum of results returned by operateOnJoinTable for all processed relations
 */
export declare const processUnidirectionalJoinTables: (db: Database, operateOnJoinTable: (db: Database, joinTableName: string, relation: any, sourceModel: any) => Promise<number>) => Promise<number>;
//# sourceMappingURL=process-unidirectional-join-tables.d.ts.map