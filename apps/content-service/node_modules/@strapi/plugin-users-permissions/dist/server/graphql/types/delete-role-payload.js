'use strict';

var deleteRolePayload;
var hasRequiredDeleteRolePayload;
function requireDeleteRolePayload() {
    if (hasRequiredDeleteRolePayload) return deleteRolePayload;
    hasRequiredDeleteRolePayload = 1;
    deleteRolePayload = ({ nexus })=>{
        return nexus.objectType({
            name: 'UsersPermissionsDeleteRolePayload',
            definition (t) {
                t.nonNull.boolean('ok');
            }
        });
    };
    return deleteRolePayload;
}

exports.__require = requireDeleteRolePayload;
//# sourceMappingURL=delete-role-payload.js.map
