'use strict';

var crypto = require('crypto');

/**
 * Generate an admin user hash
 */ const generateAdminUserHash = (strapi)=>{
    const ctx = strapi?.requestContext?.get();
    if (!ctx?.state?.user?.email) {
        return '';
    }
    return crypto.createHash('sha256').update(ctx.state.user.email).digest('hex');
};

exports.generateAdminUserHash = generateAdminUserHash;
//# sourceMappingURL=admin-user-hash.js.map
