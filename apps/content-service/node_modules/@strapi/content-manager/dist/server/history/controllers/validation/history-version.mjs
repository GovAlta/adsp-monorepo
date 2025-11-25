import * as yup from 'yup';
import { validateYupSchema } from '@strapi/utils';

const historyRestoreVersionSchema = yup.object().shape({
    contentType: yup.string().trim().required()
}).required();
const validateRestoreVersion = validateYupSchema(historyRestoreVersionSchema);

export { validateRestoreVersion };
//# sourceMappingURL=history-version.mjs.map
