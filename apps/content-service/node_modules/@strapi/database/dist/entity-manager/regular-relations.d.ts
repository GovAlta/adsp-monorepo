/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import type { Knex } from 'knex';
import type { Database } from '..';
import type { ID, Relation } from '../types';
declare module 'knex' {
    namespace Knex {
        interface ChainableInterface {
            transacting(trx?: Knex.Transaction): this;
        }
    }
}
/**
 * If some relations currently exist for this oneToX relation, on the one side, this function removes them and update the inverse order if needed.
 */
declare const deletePreviousOneToAnyRelations: ({ id, attribute, relIdsToadd, db, transaction: trx, }: {
    id: ID;
    attribute: Relation.Bidirectional;
    relIdsToadd: ID[];
    db: Database;
    transaction?: Knex.Transaction;
}) => Promise<void>;
/**
 * If a relation currently exists for this xToOne relations, this function removes it and update the inverse order if needed.
 */
declare const deletePreviousAnyToOneRelations: ({ id, attribute, relIdToadd, db, transaction: trx, }: {
    id: ID;
    attribute: Relation.Bidirectional;
    relIdToadd: ID;
    db: Database;
    transaction?: Knex.Transaction;
}) => Promise<void>;
/**
 * Delete all or some relations of entity field
 */
declare const deleteRelations: ({ id, attribute, db, relIdsToNotDelete, relIdsToDelete, transaction: trx, }: {
    id: ID;
    attribute: Relation.Bidirectional;
    db: Database;
    relIdsToNotDelete?: ID[];
    relIdsToDelete?: ID[] | 'all';
    transaction?: Knex.Transaction;
}) => Promise<void>;
/**
 * Clean the order columns by ensuring the order value are continuous (ex: 1, 2, 3 and not 1, 5, 10)
 */
declare const cleanOrderColumns: ({ id, attribute, db, inverseRelIds, transaction: trx, }: {
    id?: ID;
    attribute: Relation.Bidirectional;
    db: Database;
    inverseRelIds?: ID[];
    transaction?: Knex.Transaction;
}) => Promise<[void, void] | undefined>;
export { deletePreviousOneToAnyRelations, deletePreviousAnyToOneRelations, deleteRelations, cleanOrderColumns, };
//# sourceMappingURL=regular-relations.d.ts.map