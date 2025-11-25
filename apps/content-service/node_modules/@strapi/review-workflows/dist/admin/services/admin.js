'use strict';

var api = require('./api.js');

const adminApi = api.reviewWorkflowsApi.injectEndpoints({
    endpoints (builder) {
        return {
            getAdminRoles: builder.query({
                query: ()=>({
                        url: `/admin/roles`,
                        method: 'GET'
                    }),
                transformResponse: (res)=>{
                    return res.data;
                }
            })
        };
    }
});
const { useGetAdminRolesQuery } = adminApi;

exports.useGetAdminRolesQuery = useGetAdminRolesQuery;
//# sourceMappingURL=admin.js.map
