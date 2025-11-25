'use strict';

var api = require('../../../../admin/src/services/api.js');

const auditLogsService = api.adminApi.injectEndpoints({
    endpoints: (builder)=>({
            getAuditLogs: builder.query({
                query: (params)=>({
                        url: `/admin/audit-logs`,
                        config: {
                            params
                        }
                    })
            }),
            getAuditLog: builder.query({
                query: (id)=>`/admin/audit-logs/${id}`
            })
        }),
    overrideExisting: false
});
const { useGetAuditLogsQuery, useGetAuditLogQuery } = auditLogsService;

exports.useGetAuditLogQuery = useGetAuditLogQuery;
exports.useGetAuditLogsQuery = useGetAuditLogsQuery;
//# sourceMappingURL=auditLogs.js.map
