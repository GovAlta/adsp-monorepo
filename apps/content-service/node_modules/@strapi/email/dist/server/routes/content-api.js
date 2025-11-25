'use strict';

var utils = require('@strapi/utils');
var email = require('./validation/email.js');

const createRoutes = utils.createContentApiRoutesFactory(()=>{
    const validator = new email.EmailRouteValidator(strapi);
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

module.exports = createRoutes;
//# sourceMappingURL=content-api.js.map
