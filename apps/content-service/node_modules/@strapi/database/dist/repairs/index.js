'use strict';

var removeOrphanMorphTypes = require('./operations/remove-orphan-morph-types.js');
var processUnidirectionalJoinTables = require('./operations/process-unidirectional-join-tables.js');
var asyncCurry = require('../utils/async-curry.js');

const createRepairManager = (db)=>{
    return {
        removeOrphanMorphType: asyncCurry.asyncCurry(removeOrphanMorphTypes.removeOrphanMorphType)(db),
        processUnidirectionalJoinTables: asyncCurry.asyncCurry(processUnidirectionalJoinTables.processUnidirectionalJoinTables)(db)
    };
};

exports.createRepairManager = createRepairManager;
//# sourceMappingURL=index.js.map
