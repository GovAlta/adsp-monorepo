import knex from 'knex';
import type { Ctx } from '../types';
type OrderByCtx = Ctx & {
    alias?: string;
};
type OrderBy = string | {
    [key: string]: 'asc' | 'desc';
} | OrderBy[];
type OrderByValue = {
    column: string;
    order?: 'asc' | 'desc';
};
export declare const processOrderBy: (orderBy: OrderBy, ctx: OrderByCtx) => OrderByValue[];
export declare const getStrapiOrderColumnAlias: (column: string) => string;
/**
 * Wraps the original Knex query with deep sorting functionality.
 *
 * The function takes an original query and an OrderByCtx object as parameters and returns a new Knex query with deep sorting applied.
 */
export declare const wrapWithDeepSort: (originalQuery: knex.Knex.QueryBuilder, ctx: OrderByCtx) => knex.Knex.QueryBuilder<any, any>;
export {};
//# sourceMappingURL=order-by.d.ts.map