import { __require as requireCreateRole } from './crud/role/create-role.mjs';
import { __require as requireUpdateRole } from './crud/role/update-role.mjs';
import { __require as requireDeleteRole } from './crud/role/delete-role.mjs';
import { __require as requireCreateUser } from './crud/user/create-user.mjs';
import { __require as requireUpdateUser } from './crud/user/update-user.mjs';
import { __require as requireDeleteUser } from './crud/user/delete-user.mjs';
import { __require as requireLogin } from './auth/login.mjs';
import { __require as requireRegister } from './auth/register.mjs';
import { __require as requireForgotPassword } from './auth/forgot-password.mjs';
import { __require as requireResetPassword } from './auth/reset-password.mjs';
import { __require as requireChangePassword } from './auth/change-password.mjs';
import { __require as requireEmailConfirmation } from './auth/email-confirmation.mjs';

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
            [naming.getCreateMutationTypeName(role)]: requireCreateRole(),
            [naming.getUpdateMutationTypeName(role)]: requireUpdateRole(),
            [naming.getDeleteMutationTypeName(role)]: requireDeleteRole(),
            [naming.getCreateMutationTypeName(user)]: requireCreateUser(),
            [naming.getUpdateMutationTypeName(user)]: requireUpdateUser(),
            [naming.getDeleteMutationTypeName(user)]: requireDeleteUser(),
            // Other mutations
            login: requireLogin(),
            register: requireRegister(),
            forgotPassword: requireForgotPassword(),
            resetPassword: requireResetPassword(),
            changePassword: requireChangePassword(),
            emailConfirmation: requireEmailConfirmation()
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

export { requireMutations as __require };
//# sourceMappingURL=index.mjs.map
