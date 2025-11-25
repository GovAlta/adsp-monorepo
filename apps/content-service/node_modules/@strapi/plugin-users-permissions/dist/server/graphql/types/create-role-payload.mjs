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

export { requireCreateRolePayload as __require };
//# sourceMappingURL=create-role-payload.mjs.map
