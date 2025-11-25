import type { Knex } from 'knex';
import type { Ctx } from '../types';
type WhereCtx = Ctx & {
    alias?: string;
    isGroupRoot?: boolean;
};
/**
 * Process where parameter
 */
declare function processWhere(where: Record<string, unknown>, ctx: WhereCtx): Record<string, unknown>;
declare function processWhere(where: Record<string, unknown>[], ctx: WhereCtx): Record<string, unknown>[];
type Where = {
    $and?: Where[];
    $or?: Where[];
    $not?: Where;
    [key: string]: any;
} | Array<Where>;
declare const applyWhere: (qb: Knex.QueryBuilder, where: Where) => Knex.QueryBuilder<any, any> | undefined;
export { applyWhere, processWhere };
//# sourceMappingURL=where.d.ts.map