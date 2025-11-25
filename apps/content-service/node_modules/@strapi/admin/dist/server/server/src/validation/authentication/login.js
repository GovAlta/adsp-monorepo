'use strict';

var utils = require('@strapi/utils');

/**
 * Validates optional session-related fields for login requests.
 * Does not constrain credential fields (email/password) handled by passport.
 */ const schema = utils.yup.object().shape({
    deviceId: utils.yup.string().uuid().optional(),
    rememberMe: utils.yup.boolean().optional()
})// Allow other properties (like email/password) to be present
.noUnknown(false);
var validateLoginSessionInput = utils.validateYupSchema(schema);

module.exports = validateLoginSessionInput;
//# sourceMappingURL=login.js.map
