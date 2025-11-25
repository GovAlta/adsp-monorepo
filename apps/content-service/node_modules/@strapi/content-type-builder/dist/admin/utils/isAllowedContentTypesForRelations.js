'use strict';

const isAllowedContentTypesForRelations = (contentType)=>{
    return contentType.kind === 'collectionType' && (contentType.restrictRelationsTo === null || Array.isArray(contentType.restrictRelationsTo) && contentType.restrictRelationsTo.length > 0);
};

exports.isAllowedContentTypesForRelations = isAllowedContentTypesForRelations;
//# sourceMappingURL=isAllowedContentTypesForRelations.js.map
