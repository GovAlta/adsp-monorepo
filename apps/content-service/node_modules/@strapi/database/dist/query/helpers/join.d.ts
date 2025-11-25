import type { Knex } from 'knex';
import type { Ctx } from '../types';
export interface Join {
    method?: 'leftJoin' | 'innerJoin';
    alias: string;
    referencedTable: string;
    referencedColumn: string;
    rootColumn: string;
    rootTable?: string;
    on?: Record<string, any>;
    orderBy?: Record<string, 'asc' | 'desc'>;
}
interface JoinOptions {
    alias: string;
    refAlias?: string;
    attributeName: string;
    attribute: any;
}
interface PivotJoinOptions {
    alias: string;
    refAlias?: string;
    joinTable: any;
    targetMeta: any;
}
declare const createPivotJoin: (ctx: Ctx, { alias, refAlias, joinTable, targetMeta }: PivotJoinOptions) => string;
declare const createJoin: (ctx: Ctx, { alias, refAlias, attributeName, attribute }: JoinOptions) => string;
declare const applyJoin: (qb: Knex.QueryBuilder, join: Join) => void;
declare const applyJoins: (qb: Knex.QueryBuilder, joins: Join[]) => void;
export { createJoin, createPivotJoin, applyJoins, applyJoin };
//# sourceMappingURL=join.d.ts.map