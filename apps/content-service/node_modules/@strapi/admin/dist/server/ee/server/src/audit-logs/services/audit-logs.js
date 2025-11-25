'use strict';

const getSanitizedUser = (user)=>{
    let displayName = user.email;
    if (user.username) {
        displayName = user.username;
    } else if (user.firstname && user.lastname) {
        displayName = `${user.firstname} ${user.lastname}`;
    }
    return {
        id: user.id,
        email: user.email,
        displayName
    };
};
/**
 * @description
 * Manages audit logs interaction with the database. Accessible via strapi.get('audit-logs')
 */ const createAuditLogsService = (strapi)=>{
    return {
        async saveEvent (event) {
            const { userId, ...rest } = event;
            const auditLog = {
                ...rest,
                user: userId
            };
            // Save to database
            await strapi.db?.query('admin::audit-log').create({
                data: auditLog
            });
            return this;
        },
        async findMany (query) {
            const { results, pagination } = await strapi.db?.query('admin::audit-log').findPage({
                populate: [
                    'user'
                ],
                select: [
                    'action',
                    'date',
                    'payload'
                ],
                ...strapi.get('query-params').transform('admin::audit-log', query)
            });
            const sanitizedResults = results.map((result)=>{
                const { user, ...rest } = result;
                return {
                    ...rest,
                    user: user ? getSanitizedUser(user) : null
                };
            });
            return {
                results: sanitizedResults,
                pagination
            };
        },
        async findOne (id) {
            const result = await strapi.db?.query('admin::audit-log').findOne({
                where: {
                    id
                },
                populate: [
                    'user'
                ],
                select: [
                    'action',
                    'date',
                    'payload'
                ]
            });
            if (!result) {
                return null;
            }
            const { user, ...rest } = result;
            return {
                ...rest,
                user: user ? getSanitizedUser(user) : null
            };
        },
        deleteExpiredEvents (expirationDate) {
            return strapi.db?.query('admin::audit-log').deleteMany({
                where: {
                    date: {
                        $lt: expirationDate.toISOString()
                    }
                }
            });
        }
    };
};

exports.createAuditLogsService = createAuditLogsService;
//# sourceMappingURL=audit-logs.js.map
