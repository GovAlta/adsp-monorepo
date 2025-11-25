import { removeOrphanMorphType } from './operations/remove-orphan-morph-types.mjs';
import { processUnidirectionalJoinTables } from './operations/process-unidirectional-join-tables.mjs';
import { asyncCurry } from '../utils/async-curry.mjs';

const createRepairManager = (db)=>{
    return {
        removeOrphanMorphType: asyncCurry(removeOrphanMorphType)(db),
        processUnidirectionalJoinTables: asyncCurry(processUnidirectionalJoinTables)(db)
    };
};

export { createRepairManager };
//# sourceMappingURL=index.mjs.map
