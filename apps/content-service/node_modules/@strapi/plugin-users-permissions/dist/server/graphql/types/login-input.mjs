var loginInput;
var hasRequiredLoginInput;
function requireLoginInput() {
    if (hasRequiredLoginInput) return loginInput;
    hasRequiredLoginInput = 1;
    loginInput = ({ nexus })=>{
        return nexus.inputObjectType({
            name: 'UsersPermissionsLoginInput',
            definition (t) {
                t.nonNull.string('identifier');
                t.nonNull.string('password');
                t.nonNull.string('provider', {
                    default: 'local'
                });
            }
        });
    };
    return loginInput;
}

export { requireLoginInput as __require };
//# sourceMappingURL=login-input.mjs.map
