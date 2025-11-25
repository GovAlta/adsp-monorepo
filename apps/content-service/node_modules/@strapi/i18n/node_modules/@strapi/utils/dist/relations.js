'use strict';

var fp = require('lodash/fp');
var contentTypes = require('./content-types.js');

const MANY_RELATIONS = [
    'oneToMany',
    'manyToMany'
];
const getRelationalFields = (contentType)=>{
    return Object.keys(contentType.attributes).filter((attributeName)=>{
        return contentType.attributes[attributeName].type === 'relation';
    });
};
const isOneToAny = (attribute)=>contentTypes.isRelationalAttribute(attribute) && [
        'oneToOne',
        'oneToMany'
    ].includes(attribute.relation);
const isManyToAny = (attribute)=>contentTypes.isRelationalAttribute(attribute) && [
        'manyToMany',
        'manyToOne'
    ].includes(attribute.relation);
const isAnyToOne = (attribute)=>contentTypes.isRelationalAttribute(attribute) && [
        'oneToOne',
        'manyToOne'
    ].includes(attribute.relation);
const isAnyToMany = (attribute)=>contentTypes.isRelationalAttribute(attribute) && [
        'oneToMany',
        'manyToMany'
    ].includes(attribute.relation);
const isPolymorphic = (attribute)=>[
        'morphOne',
        'morphMany',
        'morphToOne',
        'morphToMany'
    ].includes(attribute.relation);
const constants = {
    MANY_RELATIONS
};
// Valid keys in the `options` property of relations reordering
// The value for each key must be a function that returns true if it is a valid value
const VALID_RELATION_ORDERING_KEYS = {
    strict: fp.isBoolean
};

exports.VALID_RELATION_ORDERING_KEYS = VALID_RELATION_ORDERING_KEYS;
exports.constants = constants;
exports.getRelationalFields = getRelationalFields;
exports.isAnyToMany = isAnyToMany;
exports.isAnyToOne = isAnyToOne;
exports.isManyToAny = isManyToAny;
exports.isOneToAny = isOneToAny;
exports.isPolymorphic = isPolymorphic;
//# sourceMappingURL=relations.js.map
