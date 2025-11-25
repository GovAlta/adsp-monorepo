import { prop } from 'lodash/fp';
import { async, errors } from '@strapi/utils';
import { getAdminService } from '../utils/index.mjs';
import { STAGE_TRANSITION_UID } from '../constants/workflows.mjs';

const { ApplicationError } = errors;
const validActions = [
    STAGE_TRANSITION_UID
];
var stagePermissions = (({ strapi })=>{
    const roleService = getAdminService('role');
    const permissionService = getAdminService('permission');
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
            return async.map(permissions, this.register);
        },
        async unregister (permissions) {
            const permissionIds = permissions.map(prop('id'));
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

export { stagePermissions as default };
//# sourceMappingURL=stage-permissions.mjs.map
