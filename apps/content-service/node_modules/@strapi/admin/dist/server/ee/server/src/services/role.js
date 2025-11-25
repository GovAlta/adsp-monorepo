'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');

const { ApplicationError } = utils.errors;
const ssoCheckRolesIdForDeletion = async (ids)=>{
    const adminStore = await strapi.store({
        type: 'core',
        name: 'admin'
    });
    const { providers: { defaultRole } } = await adminStore.get({
        key: 'auth'
    });
    for (const roleId of ids){
        if (defaultRole && fp.toString(defaultRole) === fp.toString(roleId)) {
            throw new ApplicationError('This role is used as the default SSO role. Make sure to change this configuration before deleting the role');
        }
    }
};
var role = {
    ssoCheckRolesIdForDeletion
};

module.exports = role;
//# sourceMappingURL=role.js.map
