import * as yup from 'yup';
import { defaults } from 'lodash/fp';
import { YupValidationError } from './errors.mjs';

const handleYupError = (error, errorMessage)=>{
    throw new YupValidationError(error, errorMessage);
};
const defaultValidationParam = {
    strict: true,
    abortEarly: false
};
const validateYupSchema = (schema, options = {})=>async (body, errorMessage)=>{
        try {
            const optionsWithDefaults = defaults(defaultValidationParam, options);
            const result = await schema.validate(body, optionsWithDefaults);
            return result;
        } catch (e) {
            if (e instanceof yup.ValidationError) {
                handleYupError(e, errorMessage);
            }
            throw e;
        }
    };
const validateYupSchemaSync = (schema, options = {})=>(body, errorMessage)=>{
        try {
            const optionsWithDefaults = defaults(defaultValidationParam, options);
            return schema.validateSync(body, optionsWithDefaults);
        } catch (e) {
            if (e instanceof yup.ValidationError) {
                handleYupError(e, errorMessage);
            }
            throw e;
        }
    };

export { handleYupError, validateYupSchema, validateYupSchemaSync };
//# sourceMappingURL=validators.mjs.map
