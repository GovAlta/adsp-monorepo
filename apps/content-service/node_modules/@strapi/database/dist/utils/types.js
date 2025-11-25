'use strict';

const SCALAR_TYPES = [
    'increments',
    'password',
    'email',
    'string',
    'uid',
    'richtext',
    'text',
    'json',
    'enumeration',
    'integer',
    'biginteger',
    'float',
    'decimal',
    'date',
    'time',
    'datetime',
    'timestamp',
    'boolean',
    'blocks'
];
const STRING_TYPES = [
    'string',
    'text',
    'uid',
    'email',
    'enumeration',
    'richtext'
];
const NUMBER_TYPES = [
    'biginteger',
    'integer',
    'decimal',
    'float'
];
const isString = (type)=>STRING_TYPES.includes(type);
const isNumber = (type)=>NUMBER_TYPES.includes(type);
const isScalar = (type)=>SCALAR_TYPES.includes(type);
const isRelation = (type)=>type === 'relation';
const isScalarAttribute = (attribute)=>isScalar(attribute.type);
const isRelationalAttribute = (attribute)=>isRelation(attribute.type);

exports.isNumber = isNumber;
exports.isRelation = isRelation;
exports.isRelationalAttribute = isRelationalAttribute;
exports.isScalar = isScalar;
exports.isScalarAttribute = isScalarAttribute;
exports.isString = isString;
//# sourceMappingURL=types.js.map
