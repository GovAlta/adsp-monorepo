'use strict';

var nameToSlug = require('../../../utils/nameToSlug.js');

const createUid = (name)=>{
    const modelName = nameToSlug.nameToSlug(name);
    return `api::${modelName}.${modelName}`;
};
// From `content-type-builder/services/Components/createComponentUid`
const createComponentUid = (name, category)=>{
    return `${nameToSlug.nameToSlug(category)}.${nameToSlug.nameToSlug(name)}`;
};

exports.createComponentUid = createComponentUid;
exports.createUid = createUid;
//# sourceMappingURL=createUid.js.map
