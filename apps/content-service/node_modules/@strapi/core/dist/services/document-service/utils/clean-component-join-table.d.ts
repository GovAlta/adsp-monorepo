import type { Database } from '@strapi/database';
/**
 * Cleans ghost relations with publication state mismatches from a join table
 * Uses schema-based draft/publish checking like prevention fix
 */
export declare const cleanComponentJoinTable: (db: Database, joinTableName: string, relation: any, sourceModel: any) => Promise<number>;
//# sourceMappingURL=clean-component-join-table.d.ts.map