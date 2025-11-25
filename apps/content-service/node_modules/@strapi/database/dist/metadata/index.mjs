export { hasInverseOrderColumn, hasOrderColumn, isAnyToOne, isBidirectional, isManyToAny, isOneToAny } from './relations.mjs';
import { Metadata } from './metadata.mjs';

// TODO: check if there isn't an attribute with an id already
/**
 * Create Metadata from models configurations
 */ const createMetadata = (models)=>{
    const metadata = new Metadata();
    if (models.length) {
        metadata.loadModels(models);
    }
    return metadata;
};

export { createMetadata };
//# sourceMappingURL=index.mjs.map
