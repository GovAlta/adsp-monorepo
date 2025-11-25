'use strict';

var fp = require('lodash/fp');
var strapiUtils = require('@strapi/utils');

const isNumeric = (value)=>{
    if (Array.isArray(value)) return false; // Handle [1, 'docId'] case
    const parsed = parseInt(value, 10);
    return !Number.isNaN(parsed);
};
const toArray = (value)=>{
    // Keep value as it is if it's a nullish value
    if (fp.isNil(value)) return value;
    if (Array.isArray(value)) return value;
    return [
        value
    ];
};
/**
 * There are multiple ways to create Strapi relations.
 * This is a utility to traverse and transform relation data
 *
 *
 * For consistency and ease of use, the response will always be an object with the following shape:
 * { set: [{...}], connect: [{...}], disconnect: [{...}] }
 *
 * @example
 * transformRelationData({
 *  onLongHand: (relation) => {
 *    // Change the id of the relation
 *    return { id: 'other' };
 *  },
 * }, relation)
 */ const mapRelation = async (callback, rel, isRecursive = false)=>{
    let relation = rel;
    const wrapInSet = (value)=>{
        // Ignore wrapping if it's a recursive call
        if (isRecursive) {
            return value;
        }
        return {
            set: toArray(value)
        };
    };
    // undefined | null
    if (fp.isNil(relation)) {
        return callback(relation);
    }
    // LongHand[] | ShortHand[]
    if (Array.isArray(relation)) {
        return strapiUtils.async.map(relation, (r)=>mapRelation(callback, r, true)).then((result)=>result.flat().filter(Boolean)).then(wrapInSet);
    }
    // LongHand
    if (fp.isObject(relation)) {
        // { id: 1 } || { documentId: 1 }
        if ('id' in relation || 'documentId' in relation) {
            const result = await callback(relation);
            return wrapInSet(result);
        }
        // If not connecting anything, return default visitor
        if (!relation.set && !relation.disconnect && !relation.connect) {
            return callback(relation);
        }
        // { set }
        if (relation.set) {
            const set = await mapRelation(callback, relation.set, true);
            relation = {
                ...relation,
                set: toArray(set)
            };
        }
        // { disconnect}
        if (relation.disconnect) {
            const disconnect = await mapRelation(callback, relation.disconnect, true);
            relation = {
                ...relation,
                disconnect: toArray(disconnect)
            };
        }
        // { connect }
        if (relation.connect) {
            // Transform the relation to connect
            const connect = await mapRelation(callback, relation.connect, true);
            relation = {
                ...relation,
                connect: toArray(connect)
            };
        }
        return relation;
    }
    // ShortHand
    if (isNumeric(relation)) {
        const result = await callback({
            id: relation
        });
        return wrapInSet(result);
    }
    if (typeof relation === 'string') {
        const result = await callback({
            documentId: relation
        });
        return wrapInSet(result);
    }
    // Anything else
    return callback(relation);
};
/**
 * Utility function, same as `traverseEntity` but only for relations.
 */ const traverseEntityRelations = async (visitor, options, data)=>{
    return strapiUtils.traverseEntity(async (options, utils)=>{
        const { attribute } = options;
        if (!attribute) {
            return;
        }
        if (attribute.type !== 'relation') {
            return;
        }
        // TODO: Handle join columns
        if (attribute.useJoinTable === false) {
            return;
        }
        return visitor(options, utils);
    }, options, data);
};
const mapRelationCurried = fp.curry(mapRelation);
const traverseEntityRelationsCurried = fp.curry(traverseEntityRelations);

exports.mapRelation = mapRelationCurried;
exports.traverseEntityRelations = traverseEntityRelationsCurried;
//# sourceMappingURL=map-relation.js.map
