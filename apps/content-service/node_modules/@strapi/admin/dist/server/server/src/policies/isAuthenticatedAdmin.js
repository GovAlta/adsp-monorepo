'use strict';

var isAuthenticatedAdmin = ((policyCtx)=>{
    return Boolean(policyCtx.state.isAuthenticated);
});

module.exports = isAuthenticatedAdmin;
//# sourceMappingURL=isAuthenticatedAdmin.js.map
