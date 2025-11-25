var me;
var hasRequiredMe;
function requireMe() {
    if (hasRequiredMe) return me;
    hasRequiredMe = 1;
    me = ()=>({
            type: 'UsersPermissionsMe',
            args: {},
            resolve (parent, args, context) {
                const { user } = context.state;
                if (!user) {
                    throw new Error('Authentication requested');
                }
                return user;
            }
        });
    return me;
}

export { requireMe as __require };
//# sourceMappingURL=me.mjs.map
