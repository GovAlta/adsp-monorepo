'use strict';

var me;
var hasRequiredMe;
function requireMe() {
    if (hasRequiredMe) return me;
    hasRequiredMe = 1;
    me = ({ nexus })=>{
        return nexus.objectType({
            name: 'UsersPermissionsMe',
            definition (t) {
                t.nonNull.id('id');
                t.nonNull.id('documentId');
                t.nonNull.string('username');
                t.string('email');
                t.boolean('confirmed');
                t.boolean('blocked');
                t.field('role', {
                    type: 'UsersPermissionsMeRole'
                });
            }
        });
    };
    return me;
}

exports.__require = requireMe;
//# sourceMappingURL=me.js.map
