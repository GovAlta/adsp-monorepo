import { translatedErrors } from '@strapi/admin/strapi-admin';
import { snakeCase } from 'lodash/fp';
import * as yup from 'yup';
import { getTrad } from '../../../utils/getTrad.mjs';
import { createUid } from '../utils/createUid.mjs';

const createContentTypeSchema = ({ usedContentTypeNames = [], reservedModels = [], singularNames = [], pluralNames = [], collectionNames = [] })=>{
    const shape = {
        displayName: yup.string().test({
            name: 'nameAlreadyUsed',
            message: translatedErrors.unique.id,
            test (value) {
                if (!value) {
                    return false;
                }
                const name = createUid(value);
                const snakeCaseKey = snakeCase(name);
                return !usedContentTypeNames.some((value)=>{
                    return snakeCase(value) === snakeCaseKey;
                });
            }
        }).test({
            name: 'nameNotAllowed',
            message: getTrad('error.contentTypeName.reserved-name'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = snakeCase(value);
                return !reservedModels.some((key)=>{
                    return snakeCase(key) === snakeCaseKey;
                });
            }
        }).required(translatedErrors.required.id),
        pluralName: yup.string().test({
            name: 'pluralNameAlreadyUsed',
            message: translatedErrors.unique.id,
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = snakeCase(value);
                return !pluralNames.some((key)=>{
                    return snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'pluralNameAlreadyUsedAsSingular',
            message: getTrad('error.contentType.pluralName-equals-singularName'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = snakeCase(value);
                return !singularNames.some((key)=>{
                    return snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'pluralAndSingularAreUnique',
            message: getTrad('error.contentType.pluralName-used'),
            test (value, context) {
                if (!value) {
                    return false;
                }
                return snakeCase(context.parent.singularName) !== snakeCase(value);
            }
        }).test({
            name: 'pluralNameNotAllowed',
            message: getTrad('error.contentTypeName.reserved-name'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = snakeCase(value);
                return !reservedModels.some((key)=>{
                    return snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'pluralNameNotAlreadyUsedInCollectionName',
            message: getTrad('error.contentType.pluralName-equals-collectionName'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = snakeCase(value);
                return !collectionNames.some((key)=>{
                    return snakeCase(key) === snakeCaseKey;
                });
            }
        }).required(translatedErrors.required.id),
        singularName: yup.string().test({
            name: 'singularNameAlreadyUsed',
            message: translatedErrors.unique.id,
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = snakeCase(value);
                return !singularNames.some((key)=>{
                    return snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'singularNameAlreadyUsedAsPlural',
            message: getTrad('error.contentType.singularName-equals-pluralName'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = snakeCase(value);
                return !pluralNames.some((key)=>{
                    return snakeCase(key) === snakeCaseKey;
                });
            }
        }).test({
            name: 'pluralAndSingularAreUnique',
            message: getTrad('error.contentType.singularName-used'),
            test (value, context) {
                if (!value) {
                    return false;
                }
                return snakeCase(context.parent.pluralName) !== snakeCase(value);
            }
        }).test({
            name: 'singularNameNotAllowed',
            message: getTrad('error.contentTypeName.reserved-name'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = snakeCase(value);
                return !reservedModels.some((key)=>{
                    return snakeCase(key) === snakeCaseKey;
                });
            }
        }).required(translatedErrors.required.id),
        draftAndPublish: yup.boolean(),
        kind: yup.string().oneOf([
            'singleType',
            'collectionType'
        ])
    };
    return yup.object(shape);
};

export { createContentTypeSchema };
//# sourceMappingURL=createContentTypeSchema.mjs.map
