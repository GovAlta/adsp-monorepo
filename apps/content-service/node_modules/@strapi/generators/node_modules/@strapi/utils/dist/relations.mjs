import { isBoolean } from 'lodash/fp';
import { isRelationalAttribute } from './content-types.mjs';

const MANY_RELATIONS = [
    'oneToMany',
    'manyToMany'
];
const getRelationalFields = (contentType)=>{
    return Object.keys(contentType.attributes).filter((attributeName)=>{
        return contentType.attributes[attributeName].type === 'relation';
    });
};
const isOneToAny = (attribute)=>isRelationalAttribute(attribute) && [
        'oneToOne',
        'oneToMany'
    ].includes(attribute.relation);
const isManyToAny = (attribute)=>isRelationalAttribute(attribute) && [
        'manyToMany',
        'manyToOne'
    ].includes(attribute.relation);
const isAnyToOne = (attribute)=>isRelationalAttribute(attribute) && [
        'oneToOne',
        'manyToOne'
    ].includes(attribute.relation);
const isAnyToMany = (attribute)=>isRelationalAttribute(attribute) && [
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
    strict: isBoolean
};

export { VALID_RELATION_ORDERING_KEYS, constants, getRelationalFields, isAnyToMany, isAnyToOne, isManyToAny, isOneToAny, isPolymorphic };
//# sourceMappingURL=relations.mjs.map
