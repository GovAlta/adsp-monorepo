import type { Database } from '../..';
/**
 * Validates bidirectional relations before starting the server.
 * - If both sides use inversedBy, one of the sides must switch to mappedBy.
 *    When this happens, two join tables exist in the database.
 *    This makes sure you switch the side which does not delete any data.
 *
 * @param {*} db
 * @return {*}
 */
export declare const validateBidirectionalRelations: (db: Database) => Promise<void>;
//# sourceMappingURL=bidirectional.d.ts.map