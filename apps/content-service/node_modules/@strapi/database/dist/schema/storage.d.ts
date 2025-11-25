import type { Database } from '..';
import type { Schema } from './types';
declare const _default: (db: Database) => {
    read(): Promise<{
        id: number;
        time: Date;
        hash: string;
        schema: Schema;
    } | null>;
    hashSchema(schema: Schema): string;
    add(schema: Schema): Promise<void>;
    clear(): Promise<void>;
};
export default _default;
//# sourceMappingURL=storage.d.ts.map