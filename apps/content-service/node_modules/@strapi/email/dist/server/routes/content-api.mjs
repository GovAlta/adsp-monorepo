import { createContentApiRoutesFactory } from '@strapi/utils';
import { EmailRouteValidator } from './validation/email.mjs';

const createRoutes = createContentApiRoutesFactory(()=>{
    const validator = new EmailRouteValidator(strapi);
    return [
        {
            method: 'POST',
            path: '/',
            handler: 'email.send',
            request: {
                body: {
                    'application/json': validator.sendEmailInput
                }
            },
            response: validator.emailResponse
        }
    ];
});

export { createRoutes as default };
//# sourceMappingURL=content-api.mjs.map
