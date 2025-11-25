'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../utils/index.js');
var constants = require('./constants.js');

const { AUTHOR_CODE, PUBLISH_ACTION } = constants;
const { NotFoundError } = utils.errors;
// TODO: move actionProvider here instead of in the permission service
/**
 * Returns actions available for a role.
 * @param {string|number} roleId
 * @returns {object[]}
 */ const getAllowedActionsForRole = async (roleId)=>{
    const { actionProvider } = index.getService('permission');
    if (!fp.isNil(roleId)) {
        const role = await index.getService('role').findOne({
            id: roleId
        });
        if (!role) {
            throw new NotFoundError('role.notFound');
        }
        if (role.code === AUTHOR_CODE) {
            return actionProvider.values().filter(({ actionId })=>actionId !== PUBLISH_ACTION);
        }
    }
    return actionProvider.values();
};

exports.getAllowedActionsForRole = getAllowedActionsForRole;
//# sourceMappingURL=action.js.map
