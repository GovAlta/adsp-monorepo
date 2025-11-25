import ___default from 'lodash';
import { yup, validateYupSchema } from '@strapi/utils';

const hasPermissionsSchema = yup.object({
    actions: yup.array().of(// @ts-expect-error yup types
    yup.lazy((val)=>{
        if (___default.isArray(val)) {
            return yup.array().of(yup.string()).min(1).max(2);
        }
        if (___default.isString(val)) {
            return yup.string().required();
        }
        return yup.object().shape({
            action: yup.string().required(),
            subject: yup.string()
        });
    }))
});
const validateHasPermissionsInput = validateYupSchema(hasPermissionsSchema);

export { validateHasPermissionsInput };
//# sourceMappingURL=hasPermissions.mjs.map
