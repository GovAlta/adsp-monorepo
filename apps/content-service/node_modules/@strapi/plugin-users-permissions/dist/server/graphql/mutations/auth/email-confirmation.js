'use strict';

var require$$0 = require('lodash/fp');
var utils = require('../../utils.js');

var emailConfirmation;
var hasRequiredEmailConfirmation;
function requireEmailConfirmation() {
    if (hasRequiredEmailConfirmation) return emailConfirmation;
    hasRequiredEmailConfirmation = 1;
    const { toPlainObject } = require$$0;
    const { checkBadRequest } = utils.__require();
    emailConfirmation = ({ nexus, strapi })=>{
        const { nonNull } = nexus;
        return {
            type: 'UsersPermissionsLoginPayload',
            args: {
                confirmation: nonNull('String')
            },
            description: 'Confirm an email users email address',
            async resolve (parent, args, context) {
                const { koaContext } = context;
                koaContext.query = toPlainObject(args);
                await strapi.plugin('users-permissions').controller('auth').emailConfirmation(koaContext, null, true);
                const output = koaContext.body;
                checkBadRequest(output);
                return {
                    user: output.user || output,
                    jwt: output.jwt
                };
            }
        };
    };
    return emailConfirmation;
}

exports.__require = requireEmailConfirmation;
//# sourceMappingURL=email-confirmation.js.map
