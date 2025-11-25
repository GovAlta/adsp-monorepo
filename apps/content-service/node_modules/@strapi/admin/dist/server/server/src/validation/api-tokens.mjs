import { yup, validateYupSchema } from '@strapi/utils';
import constants from '../services/constants.mjs';

const apiTokenCreationSchema = yup.object().shape({
    name: yup.string().min(1).required(),
    description: yup.string().optional(),
    type: yup.string().oneOf(Object.values(constants.API_TOKEN_TYPE)).required(),
    permissions: yup.array().of(yup.string()).nullable(),
    lifespan: yup.number().min(1).oneOf(Object.values(constants.API_TOKEN_LIFESPANS)).nullable()
}).noUnknown().strict();
const apiTokenUpdateSchema = yup.object().shape({
    name: yup.string().min(1).notNull(),
    description: yup.string().nullable(),
    type: yup.string().oneOf(Object.values(constants.API_TOKEN_TYPE)).notNull(),
    permissions: yup.array().of(yup.string()).nullable()
}).noUnknown().strict();
const validateApiTokenCreationInput = validateYupSchema(apiTokenCreationSchema);
const validateApiTokenUpdateInput = validateYupSchema(apiTokenUpdateSchema);

export { validateApiTokenCreationInput, validateApiTokenUpdateInput };
//# sourceMappingURL=api-tokens.mjs.map
