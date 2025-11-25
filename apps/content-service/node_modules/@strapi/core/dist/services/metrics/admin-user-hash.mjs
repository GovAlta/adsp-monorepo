import crypto from 'crypto';

/**
 * Generate an admin user hash
 */ const generateAdminUserHash = (strapi)=>{
    const ctx = strapi?.requestContext?.get();
    if (!ctx?.state?.user?.email) {
        return '';
    }
    return crypto.createHash('sha256').update(ctx.state.user.email).digest('hex');
};

export { generateAdminUserHash };
//# sourceMappingURL=admin-user-hash.mjs.map
