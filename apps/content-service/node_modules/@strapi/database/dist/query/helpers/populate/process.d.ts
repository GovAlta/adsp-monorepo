import type { QueryBuilder } from '../../query-builder';
import type { Database } from '../../..';
type Context = {
    qb: QueryBuilder;
    db: Database;
    uid: string;
};
type PopulateMap = {
    [key: string]: true | {
        populate?: PopulateMap | true | string[];
    };
};
/**
 * Converts and prepares the query for populate
 *
 * @param {boolean|string[]|object} populate populate param
 * @param {object} ctx query context
 * @param {object} ctx.db database instance
 * @param {object} ctx.qb query builder instance
 * @param {string} ctx.uid model uid
 */
declare const processPopulate: (populate: unknown, ctx: Context) => PopulateMap | null;
export default processPopulate;
//# sourceMappingURL=process.d.ts.map