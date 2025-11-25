import { yup, validateYupSchema } from '@strapi/utils';
import { isValidCategoryName } from './common.mjs';

const componentCategorySchema = yup.object({
    name: yup.string().min(3).test(isValidCategoryName).required('name.required')
}).noUnknown();
var validateComponentCategory = validateYupSchema(componentCategorySchema);

export { validateComponentCategory as default };
//# sourceMappingURL=component-category.mjs.map
