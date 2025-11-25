'use strict';

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

exports.__require = requireLoginInput;
//# sourceMappingURL=login-input.js.map
