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

export { requireDeleteRolePayload as __require };
//# sourceMappingURL=delete-role-payload.mjs.map
