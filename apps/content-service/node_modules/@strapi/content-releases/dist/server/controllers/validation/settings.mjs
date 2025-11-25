import { validateYupSchema } from '@strapi/utils';
import * as yup from 'yup';

const SETTINGS_SCHEMA = yup.object().shape({
    defaultTimezone: yup.string().nullable().default(null)
}).required().noUnknown();
const validateSettings = validateYupSchema(SETTINGS_SCHEMA);

export { SETTINGS_SCHEMA, validateSettings };
//# sourceMappingURL=settings.mjs.map
