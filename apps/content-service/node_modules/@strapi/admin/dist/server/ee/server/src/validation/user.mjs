import { yup, validateYupSchema } from '@strapi/utils';
import { schemas } from '../../../../server/src/validation/user.mjs';

const ssoUserCreationInputExtension = yup.object().shape({
    useSSORegistration: yup.boolean()
}).noUnknown();
const validateUserCreationInput = (data)=>{
    let schema = schemas.userCreationSchema;
    if (strapi.ee.features.isEnabled('sso')) {
        schema = schema.concat(ssoUserCreationInputExtension);
    }
    return validateYupSchema(schema)(data);
};

export { validateUserCreationInput };
//# sourceMappingURL=user.mjs.map
