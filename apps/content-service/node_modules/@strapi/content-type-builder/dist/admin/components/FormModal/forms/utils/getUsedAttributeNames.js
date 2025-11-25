'use strict';

const getUsedAttributeNames = (attributes, schemaData)=>{
    return attributes.filter(({ name })=>{
        return name !== schemaData.initialData.name;
    }).map(({ name })=>name);
};

exports.getUsedAttributeNames = getUsedAttributeNames;
//# sourceMappingURL=getUsedAttributeNames.js.map
