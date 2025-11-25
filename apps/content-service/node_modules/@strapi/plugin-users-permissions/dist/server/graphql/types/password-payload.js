'use strict';

var passwordPayload;
var hasRequiredPasswordPayload;
function requirePasswordPayload() {
    if (hasRequiredPasswordPayload) return passwordPayload;
    hasRequiredPasswordPayload = 1;
    passwordPayload = ({ nexus })=>{
        return nexus.objectType({
            name: 'UsersPermissionsPasswordPayload',
            definition (t) {
                t.nonNull.boolean('ok');
            }
        });
    };
    return passwordPayload;
}

exports.__require = requirePasswordPayload;
//# sourceMappingURL=password-payload.js.map
