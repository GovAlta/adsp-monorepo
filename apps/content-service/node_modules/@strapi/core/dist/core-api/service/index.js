'use strict';

var strapiUtils = require('@strapi/utils');
var singleType = require('./single-type.js');
var collectionType = require('./collection-type.js');

const isSingleType = (contentType)=>strapiUtils.contentTypes.isSingleType(contentType);
function createService({ contentType }) {
    if (isSingleType(contentType)) {
        return singleType.createSingleTypeService(contentType);
    }
    return collectionType.createCollectionTypeService(contentType);
}

exports.createService = createService;
//# sourceMappingURL=index.js.map
