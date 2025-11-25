import { yup, validateYupSchema } from '@strapi/utils';
import validators from '../common-validators.mjs';

const resetPasswordSchema = yup.object().shape({
    resetPasswordToken: yup.string().required(),
    password: validators.password.required()
}).required().noUnknown();
var validateResetPasswordInput = validateYupSchema(resetPasswordSchema);

export { validateResetPasswordInput as default };
//# sourceMappingURL=reset-password.mjs.map
