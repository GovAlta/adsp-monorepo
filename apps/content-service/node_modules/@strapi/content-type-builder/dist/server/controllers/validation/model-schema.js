'use strict';

var utils = require('@strapi/utils');
var _ = require('lodash');
var fp = require('lodash/fp');
var constants = require('../../services/constants.js');
var index = require('../../utils/index.js');
var common = require('./common.js');
var types = require('./types.js');
var relations = require('./relations.js');

const createSchema = (types, relations, { modelType } = {})=>{
    const shape = {
        description: utils.yup.string(),
        options: utils.yup.object(),
        pluginOptions: utils.yup.object(),
        collectionName: utils.yup.string().nullable().test(common.isValidCollectionName),
        attributes: createAttributesValidator({
            types,
            relations,
            modelType
        }),
        draftAndPublish: utils.yup.boolean()
    };
    if (modelType === constants.modelTypes.CONTENT_TYPE) {
        shape.kind = utils.yup.string().oneOf([
            constants.typeKinds.SINGLE_TYPE,
            constants.typeKinds.COLLECTION_TYPE
        ]).nullable();
    }
    return utils.yup.object(shape).noUnknown();
};
const createAttributesValidator = ({ types: types$1, modelType, relations: relations$1 })=>{
    return utils.yup.lazy((attributes)=>{
        return utils.yup.object().shape(_.mapValues(attributes, (attribute, key)=>{
            if (isForbiddenKey(key)) {
                return forbiddenValidator();
            }
            if (isConflictingKey(key, attributes)) {
                return conflictingKeysValidator(key);
            }
            if (attribute.type === 'relation') {
                return relations.getRelationValidator(attribute, relations$1).test(common.isValidKey(key));
            }
            if (_.has(attribute, 'type')) {
                return types.getTypeValidator(attribute, {
                    types: types$1,
                    modelType,
                    attributes
                }).test(common.isValidKey(key));
            }
            return typeOrRelationValidator;
        })).required('attributes.required');
    });
};
const isConflictingKey = (key, attributes)=>{
    const snakeCaseKey = fp.snakeCase(key);
    return Object.keys(attributes).some((existingKey)=>{
        if (existingKey === key) return false; // don't compare against itself
        return fp.snakeCase(existingKey) === snakeCaseKey;
    });
};
const isForbiddenKey = (key)=>{
    return index.getService('builder').isReservedAttributeName(key);
};
const forbiddenValidator = ()=>{
    const reservedNames = [
        ...index.getService('builder').getReservedNames().attributes
    ];
    return utils.yup.mixed().test({
        name: 'forbiddenKeys',
        message: `Attribute keys cannot be one of ${reservedNames.join(', ')}`,
        test: ()=>false
    });
};
const conflictingKeysValidator = (key)=>{
    return utils.yup.mixed().test({
        name: 'conflictingKeys',
        message: `Attribute ${key} conflicts with an existing key`,
        test: ()=>false
    });
};
const typeOrRelationValidator = utils.yup.object().test({
    name: 'mustHaveTypeOrTarget',
    message: 'Attribute must have either a type or a target',
    test: ()=>false
});

exports.createSchema = createSchema;
//# sourceMappingURL=model-schema.js.map
