'use strict';

var _ = require('lodash');
var utils = require('@strapi/utils');
var constants = require('../../services/constants.js');
var common = require('./common.js');
var modelSchema = require('./model-schema.js');
var dataTransform = require('./data-transform.js');

const VALID_RELATIONS = [
    'oneToOne',
    'oneToMany'
];
const VALID_TYPES = [
    ...constants.DEFAULT_TYPES,
    'component',
    'customField'
];
const componentSchema = modelSchema.createSchema(VALID_TYPES, VALID_RELATIONS, {
    modelType: constants.modelTypes.COMPONENT
}).shape({
    displayName: utils.yup.string().min(1).required('displayName.required'),
    icon: utils.yup.string().nullable().test(common.isValidIcon),
    category: utils.yup.string().nullable().test(common.isValidCategoryName).required('category.required')
}).required().noUnknown();
const nestedComponentSchema = utils.yup.array().of(componentSchema.shape({
    uid: utils.yup.string(),
    tmpUID: utils.yup.string()
}).test({
    name: 'mustHaveUIDOrTmpUID',
    message: 'Component must have a uid or a tmpUID',
    test (attr) {
        if (_.has(attr, 'uid') && _.has(attr, 'tmpUID')) return false;
        if (!_.has(attr, 'uid') && !_.has(attr, 'tmpUID')) return false;
        return true;
    }
}).required().noUnknown());
const componentInputSchema = utils.yup.object({
    component: componentSchema,
    components: nestedComponentSchema
}).noUnknown();
const validateComponentInput = utils.validateYupSchema(componentInputSchema);
const updateComponentInputSchema = utils.yup.object({
    component: componentSchema,
    components: nestedComponentSchema
}).noUnknown();
const validateUpdateComponentInput = (data)=>{
    if (_.has(data, 'component') && data.component) {
        dataTransform.removeEmptyDefaults(data.component);
    }
    if (_.has(data, 'components') && Array.isArray(data.components)) {
        data.components.forEach((data)=>{
            if (_.has(data, 'uid')) {
                dataTransform.removeEmptyDefaults(data);
            }
        });
    }
    return utils.validateYupSchema(updateComponentInputSchema)(data);
};

exports.VALID_RELATIONS = VALID_RELATIONS;
exports.VALID_TYPES = VALID_TYPES;
exports.componentInputSchema = componentInputSchema;
exports.componentSchema = componentSchema;
exports.nestedComponentSchema = nestedComponentSchema;
exports.validateComponentInput = validateComponentInput;
exports.validateUpdateComponentInput = validateUpdateComponentInput;
//# sourceMappingURL=component.js.map
