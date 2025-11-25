import type { Database } from '..';
export declare const createRepairManager: (db: Database) => {
    removeOrphanMorphType: (arg: import("./operations/remove-orphan-morph-types").RemoveOrphanMorphTypeOptions) => Promise<void>;
    processUnidirectionalJoinTables: (arg: (db: Database, joinTableName: string, relation: any, sourceModel: any) => Promise<number>) => Promise<number>;
};
export type RepairManager = ReturnType<typeof createRepairManager>;
//# sourceMappingURL=index.d.ts.map