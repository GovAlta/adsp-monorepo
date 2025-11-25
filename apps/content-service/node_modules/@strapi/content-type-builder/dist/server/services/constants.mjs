const modelTypes = {
    CONTENT_TYPE: 'CONTENT_TYPE',
    COMPONENT: 'COMPONENT'
};
const typeKinds = {
    SINGLE_TYPE: 'singleType',
    COLLECTION_TYPE: 'collectionType'
};
const DEFAULT_TYPES = [
    // advanced types
    'media',
    // scalar types
    'string',
    'text',
    'richtext',
    'blocks',
    'json',
    'enumeration',
    'password',
    'email',
    'integer',
    'biginteger',
    'float',
    'decimal',
    'date',
    'time',
    'datetime',
    'timestamp',
    'boolean',
    'relation'
];
const VALID_UID_TARGETS = [
    'string',
    'text'
];
const coreUids = {
    STRAPI_USER: 'admin::user',
    PREFIX: 'strapi::'
};
const pluginsUids = {
    UPLOAD_FILE: 'plugin::upload.file'
};

export { DEFAULT_TYPES, VALID_UID_TARGETS, coreUids, modelTypes, pluginsUids, typeKinds };
//# sourceMappingURL=constants.mjs.map
