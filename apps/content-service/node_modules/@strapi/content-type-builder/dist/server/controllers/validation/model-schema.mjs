import { yup } from '@strapi/utils';
import _ from 'lodash';
import { snakeCase } from 'lodash/fp';
import { modelTypes, typeKinds } from '../../services/constants.mjs';
import { getService } from '../../utils/index.mjs';
import { isValidCollectionName, isValidKey } from './common.mjs';
import { getTypeValidator } from './types.mjs';
import { getRelationValidator } from './relations.mjs';

const createSchema = (types, relations, { modelType } = {})=>{
    const shape = {
        description: yup.string(),
        options: yup.object(),
        pluginOptions: yup.object(),
        collectionName: yup.string().nullable().test(isValidCollectionName),
        attributes: createAttributesValidator({
            types,
            relations,
            modelType
        }),
        draftAndPublish: yup.boolean()
    };
    if (modelType === modelTypes.CONTENT_TYPE) {
        shape.kind = yup.string().oneOf([
            typeKinds.SINGLE_TYPE,
            typeKinds.COLLECTION_TYPE
        ]).nullable();
    }
    return yup.object(shape).noUnknown();
};
const createAttributesValidator = ({ types, modelType, relations })=>{
    return yup.lazy((attributes)=>{
        return yup.object().shape(_.mapValues(attributes, (attribute, key)=>{
            if (isForbiddenKey(key)) {
                return forbiddenValidator();
            }
            if (isConflictingKey(key, attributes)) {
                return conflictingKeysValidator(key);
            }
            if (attribute.type === 'relation') {
                return getRelationValidator(attribute, relations).test(isValidKey(key));
            }
            if (_.has(attribute, 'type')) {
                return getTypeValidator(attribute, {
                    types,
                    modelType,
                    attributes
                }).test(isValidKey(key));
            }
            return typeOrRelationValidator;
        })).required('attributes.required');
    });
};
const isConflictingKey = (key, attributes)=>{
    const snakeCaseKey = snakeCase(key);
    return Object.keys(attributes).some((existingKey)=>{
        if (existingKey === key) return false; // don't compare against itself
        return snakeCase(existingKey) === snakeCaseKey;
    });
};
const isForbiddenKey = (key)=>{
    return getService('builder').isReservedAttributeName(key);
};
const forbiddenValidator = ()=>{
    const reservedNames = [
        ...getService('builder').getReservedNames().attributes
    ];
    return yup.mixed().test({
        name: 'forbiddenKeys',
        message: `Attribute keys cannot be one of ${reservedNames.join(', ')}`,
        test: ()=>false
    });
};
const conflictingKeysValidator = (key)=>{
    return yup.mixed().test({
        name: 'conflictingKeys',
        message: `Attribute ${key} conflicts with an existing key`,
        test: ()=>false
    });
};
const typeOrRelationValidator = yup.object().test({
    name: 'mustHaveTypeOrTarget',
    message: 'Attribute must have either a type or a target',
    test: ()=>false
});

export { createSchema };
//# sourceMappingURL=model-schema.mjs.map
