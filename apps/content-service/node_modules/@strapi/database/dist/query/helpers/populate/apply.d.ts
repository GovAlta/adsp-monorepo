import type { QueryBuilder } from '../../query-builder';
import type { Database } from '../../..';
type Context = {
    db: Database;
    qb: QueryBuilder;
    uid: string;
};
type Row = Record<string, unknown>;
declare const applyPopulate: (results: Row[], populate: Record<string, any>, ctx: Context) => Promise<Row[] | undefined>;
export default applyPopulate;
//# sourceMappingURL=apply.d.ts.map