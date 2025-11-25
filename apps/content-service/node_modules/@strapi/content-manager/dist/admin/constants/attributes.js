'use strict';

const ID = 'id';
const CREATED_BY_ATTRIBUTE_NAME = 'createdBy';
const UPDATED_BY_ATTRIBUTE_NAME = 'updatedBy';
const CREATOR_FIELDS = [
    CREATED_BY_ATTRIBUTE_NAME,
    UPDATED_BY_ATTRIBUTE_NAME
];
const PUBLISHED_BY_ATTRIBUTE_NAME = 'publishedBy';
const CREATED_AT_ATTRIBUTE_NAME = 'createdAt';
const UPDATED_AT_ATTRIBUTE_NAME = 'updatedAt';
const PUBLISHED_AT_ATTRIBUTE_NAME = 'publishedAt';
const DOCUMENT_META_FIELDS = [
    ID,
    ...CREATOR_FIELDS,
    PUBLISHED_BY_ATTRIBUTE_NAME,
    CREATED_AT_ATTRIBUTE_NAME,
    UPDATED_AT_ATTRIBUTE_NAME,
    PUBLISHED_AT_ATTRIBUTE_NAME
];
/**
 * List of attribute types that cannot be used as the main field.
 * Not sure the name could be any clearer.
 */ const ATTRIBUTE_TYPES_THAT_CANNOT_BE_MAIN_FIELD = [
    'dynamiczone',
    'json',
    'text',
    'relation',
    'component',
    'boolean',
    'media',
    'password',
    'richtext',
    'timestamp',
    'blocks'
];

exports.ATTRIBUTE_TYPES_THAT_CANNOT_BE_MAIN_FIELD = ATTRIBUTE_TYPES_THAT_CANNOT_BE_MAIN_FIELD;
exports.CREATED_AT_ATTRIBUTE_NAME = CREATED_AT_ATTRIBUTE_NAME;
exports.CREATED_BY_ATTRIBUTE_NAME = CREATED_BY_ATTRIBUTE_NAME;
exports.CREATOR_FIELDS = CREATOR_FIELDS;
exports.DOCUMENT_META_FIELDS = DOCUMENT_META_FIELDS;
exports.PUBLISHED_AT_ATTRIBUTE_NAME = PUBLISHED_AT_ATTRIBUTE_NAME;
exports.PUBLISHED_BY_ATTRIBUTE_NAME = PUBLISHED_BY_ATTRIBUTE_NAME;
exports.UPDATED_AT_ATTRIBUTE_NAME = UPDATED_AT_ATTRIBUTE_NAME;
exports.UPDATED_BY_ATTRIBUTE_NAME = UPDATED_BY_ATTRIBUTE_NAME;
//# sourceMappingURL=attributes.js.map
