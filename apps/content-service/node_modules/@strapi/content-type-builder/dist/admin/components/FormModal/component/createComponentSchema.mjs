import { translatedErrors } from '@strapi/admin/strapi-admin';
import { snakeCase } from 'lodash/fp';
import * as yup from 'yup';
import { getTrad } from '../../../utils/getTrad.mjs';
import { createComponentUid } from '../utils/createUid.mjs';

const CATEGORY_NAME_REGEX = /^[A-Za-z][-_0-9A-Za-z]*$/;
const createComponentSchema = (usedComponentNames, reservedNames, category, takenCollectionNames, currentCollectionName)=>{
    const shape = {
        displayName: yup.string().test({
            name: 'nameAlreadyUsed',
            message: translatedErrors.unique.id,
            test (value) {
                if (!value) {
                    return false;
                }
                const name = createComponentUid(value, category);
                const snakeCaseKey = snakeCase(name);
                const snakeCaseCollectionName = snakeCase(currentCollectionName);
                return usedComponentNames.every((reserved)=>{
                    return snakeCase(reserved) !== snakeCaseKey;
                }) && takenCollectionNames.every((collectionName)=>snakeCase(collectionName) !== snakeCaseCollectionName);
            }
        }).test({
            name: 'nameNotAllowed',
            message: getTrad('error.contentTypeName.reserved-name'),
            test (value) {
                if (!value) {
                    return false;
                }
                const snakeCaseKey = snakeCase(value);
                return reservedNames.every((reserved)=>{
                    return snakeCase(reserved) !== snakeCaseKey;
                });
            }
        }).required(translatedErrors.required.id),
        category: yup.string().matches(CATEGORY_NAME_REGEX, translatedErrors.regex.id).required(translatedErrors.required.id),
        icon: yup.string()
    };
    return yup.object(shape);
};

export { createComponentSchema };
//# sourceMappingURL=createComponentSchema.mjs.map
