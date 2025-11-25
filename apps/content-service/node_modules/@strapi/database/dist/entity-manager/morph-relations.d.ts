/// <reference types="lodash" />
import type { Knex } from 'knex';
import type { Database } from '..';
import type { MorphJoinTable } from '../types';
type Rows = Record<string, unknown>[];
export declare const deleteRelatedMorphOneRelationsAfterMorphToManyUpdate: (rows: Rows, { uid, attributeName, joinTable, db, transaction: trx, }: {
    uid: string;
    attributeName: string;
    joinTable: MorphJoinTable;
    db: Database;
    transaction?: Knex.Transaction;
}) => Promise<void>;
/**
 * Encoding utilities for polymorphic relations.
 *
 * In some scenarios is useful to encode both the id & __type of the relation
 * to have a unique identifier for the relation. (e.g. relations reordering)
 */
export declare const encodePolymorphicId: (id: number | string, __type: string) => string;
export declare const encodePolymorphicRelation: import("lodash").CurriedFunction2<{
    idColumn: any;
    typeColumn: any;
}, any, any>;
export {};
//# sourceMappingURL=morph-relations.d.ts.map