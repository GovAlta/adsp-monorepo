'use strict';

var updateRolePayload;
var hasRequiredUpdateRolePayload;
function requireUpdateRolePayload() {
    if (hasRequiredUpdateRolePayload) return updateRolePayload;
    hasRequiredUpdateRolePayload = 1;
    updateRolePayload = ({ nexus })=>{
        return nexus.objectType({
            name: 'UsersPermissionsUpdateRolePayload',
            definition (t) {
                t.nonNull.boolean('ok');
            }
        });
    };
    return updateRolePayload;
}

exports.__require = requireUpdateRolePayload;
//# sourceMappingURL=update-role-payload.js.map
