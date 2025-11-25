import { yup, validateYupSchema } from '@strapi/utils';
import { ALLOWED_SORT_STRINGS } from '../../../constants.mjs';

const configSchema = yup.object({
    pageSize: yup.number().required(),
    sort: yup.mixed().oneOf(ALLOWED_SORT_STRINGS)
});
const validateViewConfiguration = validateYupSchema(configSchema);

export { validateViewConfiguration };
//# sourceMappingURL=configureView.mjs.map
