import type { Schema, SchemaDiff } from './types';
import type { Database } from '..';
type SchemaDiffContext = {
    previousSchema?: Schema;
    databaseSchema: Schema;
    userSchema: Schema;
};
declare const _default: (db: Database) => {
    diff: (schemaDiffCtx: SchemaDiffContext) => Promise<SchemaDiff>;
};
export default _default;
//# sourceMappingURL=diff.d.ts.map