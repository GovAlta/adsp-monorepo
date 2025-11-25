'use strict';

var fp = require('lodash/fp');

// use snake_case
const reservedAttributes = [
    // TODO: these need to come from a centralized place so we don't break things accidentally in the future and can share them outside the CTB, for example on Strapi bootstrap prior to schema db sync
    // ID fields
    'id',
    'document_id',
    // Creator fields
    'created_at',
    'updated_at',
    'published_at',
    // V6: we will need to add first_published_at when it becomes the default behaviour
    'created_by_id',
    'updated_by_id',
    // does not actually conflict because the fields are called *_by_id but we'll leave it to avoid confusion
    'created_by',
    'updated_by',
    // Used for Strapi functionality
    'entry_id',
    'status',
    'localizations',
    'meta',
    'locale',
    '__component',
    '__contentType',
    // We support ending with * to denote prefixes
    'strapi*',
    '_strapi*',
    '__strapi*'
];
// use snake_case
const reservedModels = [
    'boolean',
    'date',
    'date_time',
    'time',
    'upload',
    'document',
    'then',
    // We support ending with * to denote prefixes
    'strapi*',
    '_strapi*',
    '__strapi*'
];
const getReservedNames = ()=>{
    return {
        models: reservedModels,
        attributes: reservedAttributes
    };
};
// compare snake case to check the actual column names that will be used in the database
const isReservedModelName = (name)=>{
    const snakeCaseName = fp.snakeCase(name);
    if (reservedModels.includes(snakeCaseName)) {
        return true;
    }
    if (reservedModels.filter((key)=>key.endsWith('*')).map((key)=>key.slice(0, -1)).some((prefix)=>snakeCaseName.startsWith(prefix))) {
        return true;
    }
    return false;
};
// compare snake case to check the actual column names that will be used in the database
const isReservedAttributeName = (name)=>{
    const snakeCaseName = fp.snakeCase(name);
    if (reservedAttributes.includes(snakeCaseName)) {
        return true;
    }
    if (reservedAttributes.filter((key)=>key.endsWith('*')).map((key)=>key.slice(0, -1)).some((prefix)=>snakeCaseName.startsWith(prefix))) {
        return true;
    }
    return false;
};

exports.getReservedNames = getReservedNames;
exports.isReservedAttributeName = isReservedAttributeName;
exports.isReservedModelName = isReservedModelName;
exports.reservedAttributes = reservedAttributes;
exports.reservedModels = reservedModels;
//# sourceMappingURL=builder.js.map
