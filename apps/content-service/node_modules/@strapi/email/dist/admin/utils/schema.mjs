import { translatedErrors } from '@strapi/admin/strapi-admin';
import * as yup from 'yup';

const schema = yup.object().shape({
    email: yup.string().email(translatedErrors.email.id).required(translatedErrors.required.id)
});

export { schema };
//# sourceMappingURL=schema.mjs.map
