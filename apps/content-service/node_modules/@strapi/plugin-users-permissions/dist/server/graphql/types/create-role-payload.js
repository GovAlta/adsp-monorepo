'use strict';

var createRolePayload;
var hasRequiredCreateRolePayload;
function requireCreateRolePayload() {
    if (hasRequiredCreateRolePayload) return createRolePayload;
    hasRequiredCreateRolePayload = 1;
    createRolePayload = ({ nexus })=>{
        return nexus.objectType({
            name: 'UsersPermissionsCreateRolePayload',
            definition (t) {
                t.nonNull.boolean('ok');
            }
        });
    };
    return createRolePayload;
}

exports.__require = requireCreateRolePayload;
//# sourceMappingURL=create-role-payload.js.map
