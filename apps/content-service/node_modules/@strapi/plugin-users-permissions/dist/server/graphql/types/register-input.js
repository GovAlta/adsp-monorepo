'use strict';

var registerInput;
var hasRequiredRegisterInput;
function requireRegisterInput() {
    if (hasRequiredRegisterInput) return registerInput;
    hasRequiredRegisterInput = 1;
    registerInput = ({ nexus })=>{
        return nexus.inputObjectType({
            name: 'UsersPermissionsRegisterInput',
            definition (t) {
                t.nonNull.string('username');
                t.nonNull.string('email');
                t.nonNull.string('password');
            }
        });
    };
    return registerInput;
}

exports.__require = requireRegisterInput;
//# sourceMappingURL=register-input.js.map
