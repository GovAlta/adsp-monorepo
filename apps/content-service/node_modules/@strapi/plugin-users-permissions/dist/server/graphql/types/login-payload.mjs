var loginPayload;
var hasRequiredLoginPayload;
function requireLoginPayload() {
    if (hasRequiredLoginPayload) return loginPayload;
    hasRequiredLoginPayload = 1;
    loginPayload = ({ nexus })=>{
        return nexus.objectType({
            name: 'UsersPermissionsLoginPayload',
            definition (t) {
                t.string('jwt');
                t.nonNull.field('user', {
                    type: 'UsersPermissionsMe'
                });
            }
        });
    };
    return loginPayload;
}

export { requireLoginPayload as __require };
//# sourceMappingURL=login-payload.mjs.map
