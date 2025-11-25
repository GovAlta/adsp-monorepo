import { yup, validateYupSchema } from '@strapi/utils';
import validators from '../common-validators.mjs';

const forgotPasswordSchema = yup.object().shape({
    email: validators.email.required()
}).required().noUnknown();
var validateForgotPasswordInput = validateYupSchema(forgotPasswordSchema);

export { validateForgotPasswordInput as default };
//# sourceMappingURL=forgot-password.mjs.map
