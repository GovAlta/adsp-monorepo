var meRole;
var hasRequiredMeRole;
function requireMeRole() {
    if (hasRequiredMeRole) return meRole;
    hasRequiredMeRole = 1;
    meRole = ({ nexus })=>{
        return nexus.objectType({
            name: 'UsersPermissionsMeRole',
            definition (t) {
                t.nonNull.id('id');
                t.nonNull.string('name');
                t.string('description');
                t.string('type');
            }
        });
    };
    return meRole;
}

export { requireMeRole as __require };
//# sourceMappingURL=me-role.mjs.map
