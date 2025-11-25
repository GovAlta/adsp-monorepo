'use strict';

var createRole = require('./crud/role/create-role.js');
var updateRole = require('./crud/role/update-role.js');
var deleteRole = require('./crud/role/delete-role.js');
var createUser = require('./crud/user/create-user.js');
var updateUser = require('./crud/user/update-user.js');
var deleteUser = require('./crud/user/delete-user.js');
var login = require('./auth/login.js');
var register = require('./auth/register.js');
var forgotPassword = require('./auth/forgot-password.js');
var resetPassword = require('./auth/reset-password.js');
var changePassword = require('./auth/change-password.js');
var emailConfirmation = require('./auth/email-confirmation.js');

var mutations;
var hasRequiredMutations;
function requireMutations() {
    if (hasRequiredMutations) return mutations;
    hasRequiredMutations = 1;
    const userUID = 'plugin::users-permissions.user';
    const roleUID = 'plugin::users-permissions.role';
    mutations = (context)=>{
        const { nexus, strapi } = context;
        const { naming } = strapi.plugin('graphql').service('utils');
        const user = strapi.getModel(userUID);
        const role = strapi.getModel(roleUID);
        const mutations = {
            // CRUD (user & role)
            [naming.getCreateMutationTypeName(role)]: createRole.__require(),
            [naming.getUpdateMutationTypeName(role)]: updateRole.__require(),
            [naming.getDeleteMutationTypeName(role)]: deleteRole.__require(),
            [naming.getCreateMutationTypeName(user)]: createUser.__require(),
            [naming.getUpdateMutationTypeName(user)]: updateUser.__require(),
            [naming.getDeleteMutationTypeName(user)]: deleteUser.__require(),
            // Other mutations
            login: login.__require(),
            register: register.__require(),
            forgotPassword: forgotPassword.__require(),
            resetPassword: resetPassword.__require(),
            changePassword: changePassword.__require(),
            emailConfirmation: emailConfirmation.__require()
        };
        return nexus.extendType({
            type: 'Mutation',
            definition (t) {
                for (const [name, getConfig] of Object.entries(mutations)){
                    const config = getConfig(context);
                    t.field(name, config);
                }
            }
        });
    };
    return mutations;
}

exports.__require = requireMutations;
//# sourceMappingURL=index.js.map
