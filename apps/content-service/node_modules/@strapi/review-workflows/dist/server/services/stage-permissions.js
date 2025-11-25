'use strict';

var fp = require('lodash/fp');
var utils = require('@strapi/utils');
var index = require('../utils/index.js');
var workflows = require('../constants/workflows.js');

const { ApplicationError } = utils.errors;
const validActions = [
    workflows.STAGE_TRANSITION_UID
];
var stagePermissions = (({ strapi })=>{
    const roleService = index.getAdminService('role');
    const permissionService = index.getAdminService('permission');
    return {
        async register ({ roleId, action, fromStage }) {
            if (!validActions.includes(action)) {
                throw new ApplicationError(`Invalid action ${action}`);
            }
            const permissions = await roleService.addPermissions(roleId, [
                {
                    action,
                    actionParameters: {
                        from: fromStage
                    }
                }
            ]);
            // TODO: Filter response
            return permissions;
        },
        async registerMany (permissions) {
            return utils.async.map(permissions, this.register);
        },
        async unregister (permissions) {
            const permissionIds = permissions.map(fp.prop('id'));
            await permissionService.deleteByIds(permissionIds);
        },
        can (action, fromStage) {
            const requestState = strapi.requestContext.get()?.state;
            if (!requestState) {
                return false;
            }
            // Override permissions for super admin
            const userRoles = requestState.user?.roles;
            if (userRoles?.some((role)=>role.code === 'strapi-super-admin')) {
                return true;
            }
            return requestState.userAbility.can({
                name: action,
                params: {
                    from: fromStage
                }
            });
        }
    };
});

module.exports = stagePermissions;
//# sourceMappingURL=stage-permissions.js.map
