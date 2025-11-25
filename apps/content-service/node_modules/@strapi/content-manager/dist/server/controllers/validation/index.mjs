import _ from 'lodash';
import { yup, validateYupSchema, errors } from '@strapi/utils';
import '@strapi/types';
import '../../services/utils/configuration/attributes.mjs';
import '../../services/utils/configuration/settings.mjs';

const { PaginationError, ValidationError } = errors;
const TYPES = [
    'singleType',
    'collectionType'
];
/**
 * Validates type kind
 */ const kindSchema = yup.string().oneOf(TYPES).nullable();
const bulkActionInputSchema = yup.object({
    documentIds: yup.array().of(yup.strapiID()).min(1).required()
}).required();
const generateUIDInputSchema = yup.object({
    contentTypeUID: yup.string().required(),
    field: yup.string().required(),
    data: yup.object().required()
});
const checkUIDAvailabilityInputSchema = yup.object({
    contentTypeUID: yup.string().required(),
    field: yup.string().required(),
    value: yup.string().required().test('isValueMatchingRegex', `\${path} must match the custom regex or the default one "/^[A-Za-z0-9-_.~]*$/"`, function(value, context) {
        return value === '' || (context.options.context?.regex ? new RegExp(context.options?.context.regex).test(value) : /^[A-Za-z0-9-_.~]*$/.test(value));
    })
});
const validateUIDField = (contentTypeUID, field)=>{
    const model = strapi.contentTypes[contentTypeUID];
    if (!model) {
        throw new ValidationError('ContentType not found');
    }
    if (!_.has(model, [
        'attributes',
        field
    ]) || _.get(model, [
        'attributes',
        field,
        'type'
    ]) !== 'uid') {
        throw new ValidationError(`${field} must be a valid \`uid\` attribute`);
    }
};
const validateKind = validateYupSchema(kindSchema);
const validateBulkActionInput = validateYupSchema(bulkActionInputSchema);
const validateGenerateUIDInput = validateYupSchema(generateUIDInputSchema);
const validateCheckUIDAvailabilityInput = (body)=>{
    const options = {};
    const contentType = body.contentTypeUID in strapi.contentTypes ? strapi.contentTypes[body.contentTypeUID] : null;
    if (contentType?.attributes[body.field] && `regex` in contentType.attributes[body.field] && contentType.attributes[body.field].regex) {
        options.context = {
            regex: (contentType?.attributes[body.field]).regex
        };
    }
    const validator = validateYupSchema(checkUIDAvailabilityInputSchema, options);
    return validator(body);
};

export { validateBulkActionInput, validateCheckUIDAvailabilityInput, validateGenerateUIDInput, validateKind, validateUIDField };
//# sourceMappingURL=index.mjs.map
