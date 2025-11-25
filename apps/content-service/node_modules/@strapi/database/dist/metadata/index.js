'use strict';

var relations = require('./relations.js');
var metadata = require('./metadata.js');

// TODO: check if there isn't an attribute with an id already
/**
 * Create Metadata from models configurations
 */ const createMetadata = (models)=>{
    const metadata$1 = new metadata.Metadata();
    if (models.length) {
        metadata$1.loadModels(models);
    }
    return metadata$1;
};

exports.hasInverseOrderColumn = relations.hasInverseOrderColumn;
exports.hasOrderColumn = relations.hasOrderColumn;
exports.isAnyToOne = relations.isAnyToOne;
exports.isBidirectional = relations.isBidirectional;
exports.isManyToAny = relations.isManyToAny;
exports.isOneToAny = relations.isOneToAny;
exports.createMetadata = createMetadata;
//# sourceMappingURL=index.js.map
