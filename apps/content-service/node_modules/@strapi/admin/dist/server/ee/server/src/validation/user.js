'use strict';

var utils = require('@strapi/utils');
var user = require('../../../../server/src/validation/user.js');

const ssoUserCreationInputExtension = utils.yup.object().shape({
    useSSORegistration: utils.yup.boolean()
}).noUnknown();
const validateUserCreationInput = (data)=>{
    let schema = user.schemas.userCreationSchema;
    if (strapi.ee.features.isEnabled('sso')) {
        schema = schema.concat(ssoUserCreationInputExtension);
    }
    return utils.validateYupSchema(schema)(data);
};

exports.validateUserCreationInput = validateUserCreationInput;
//# sourceMappingURL=user.js.map
