import { adminApi } from '../../../../admin/src/services/api.mjs';

const auditLogsService = adminApi.injectEndpoints({
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

export { useGetAuditLogQuery, useGetAuditLogsQuery };
//# sourceMappingURL=auditLogs.mjs.map
