import { getService } from '../utils/index.mjs';
import { validateProfileUpdateInput } from '../validation/user.mjs';

var authenticatedUser = {
    async getMe (ctx) {
        const userInfo = getService('user').sanitizeUser(ctx.state.user);
        ctx.body = {
            data: userInfo
        };
    },
    async updateMe (ctx) {
        const input = ctx.request.body;
        await validateProfileUpdateInput(input);
        const userService = getService('user');
        const authServer = getService('auth');
        const { currentPassword, ...userInfo } = input;
        if (currentPassword && userInfo.password) {
            const isValid = await authServer.validatePassword(currentPassword, ctx.state.user.password);
            if (!isValid) {
                return ctx.badRequest('ValidationError', {
                    currentPassword: [
                        'Invalid credentials'
                    ]
                });
            }
        }
        const updatedUser = await userService.updateById(ctx.state.user.id, userInfo);
        ctx.body = {
            data: userService.sanitizeUser(updatedUser)
        };
    },
    async getOwnPermissions (ctx) {
        const { findUserPermissions, sanitizePermission } = getService('permission');
        const { user } = ctx.state;
        const userPermissions = await findUserPermissions(user);
        ctx.body = {
            // @ts-expect-error - transform response type to sanitized permission
            data: userPermissions.map(sanitizePermission)
        };
    },
    async getAiToken (ctx) {
        try {
            // Security check: Ensure user is authenticated and has proper permissions
            if (!ctx.state.user) {
                return ctx.unauthorized('Authentication required');
            }
            const tokenData = await getService('user').getAiToken();
            ctx.body = {
                data: tokenData
            };
        } catch (error) {
            const errorMessage = 'AI token request failed. Check server logs for details.';
            return ctx.internalServerError(errorMessage);
        }
    }
};

export { authenticatedUser as default };
//# sourceMappingURL=authenticated-user.mjs.map
