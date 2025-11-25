'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fp = require('lodash/fp');

const DEFAULT_CATEGORY = 'default';
/**
 * Get the default value used for every condition
 * @return {Condition}
 */ const getDefaultConditionAttributes = ()=>({
        category: DEFAULT_CATEGORY
    });
/**
 * Get the list of all the valid attributes of a {@link Condition}
 * @return {string[]}
 */ const conditionFields = [
    'id',
    'displayName',
    'handler',
    'plugin',
    'category'
];
/**
 * Remove unwanted attributes from a {@link Condition}
 */ const sanitizeConditionAttributes = fp.pick(conditionFields);
const computeConditionId = (condition)=>{
    const { name, plugin } = condition;
    if (!plugin) {
        return `api::${name}`;
    }
    if (plugin === 'admin') {
        return `admin::${name}`;
    }
    return `plugin::${plugin}.${name}`;
};
/**
 * Assign an id attribute to a {@link CreateConditionPayload} object
 * @param  attrs - Payload used to create a condition
 */ const assignConditionId = (attrs)=>{
    const condition = fp.set('id', computeConditionId(attrs), attrs);
    return condition;
};
/**
 * Transform the given attributes into a domain representation of a Condition
 * @param payload - The condition payload containing the attributes needed to create a {@link Condition}
 */ const create = fp.pipe(assignConditionId, sanitizeConditionAttributes, fp.merge(getDefaultConditionAttributes()));
var domain = {
    assignConditionId,
    computeConditionId,
    conditionFields,
    create,
    getDefaultConditionAttributes,
    sanitizeConditionAttributes
};

exports.assignConditionId = assignConditionId;
exports.computeConditionId = computeConditionId;
exports.conditionFields = conditionFields;
exports.create = create;
exports.default = domain;
exports.getDefaultConditionAttributes = getDefaultConditionAttributes;
exports.sanitizeConditionAttributes = sanitizeConditionAttributes;
//# sourceMappingURL=index.js.map
