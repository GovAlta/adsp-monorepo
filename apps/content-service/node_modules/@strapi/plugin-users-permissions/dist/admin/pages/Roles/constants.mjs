import { translatedErrors } from '@strapi/strapi/admin';
import * as yup from 'yup';

const createRoleSchema = yup.object().shape({
    name: yup.string().required(translatedErrors.required.id),
    description: yup.string().required(translatedErrors.required.id)
});

export { createRoleSchema };
//# sourceMappingURL=constants.mjs.map
